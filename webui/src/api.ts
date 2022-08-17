import { environment } from "./environment";
import { Namespace } from "./pages/core/toolbar/NamespaceSelector/models";
import { PagedNodeTasks } from "./pages/new/TaskTable/models";
import { signOutAsync } from "./pages/signin/signin.slice";
import { HandleWorkflowResponse, PagedTaskLogs, PagedWorkflows, PagedWorkflowTasks, WorkflowMetrics, WorkflowStatus } from "./pages/workflows/WorkflowTable/models";
import { store } from "./store";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";
import { HTTPException, RefreshTokenResponse, SignInRequest, SignInResponse } from "./models";

const redirectCallback: { (): void } = () => {
  store.dispatch(signOutAsync());
};
const authHeader = (config: AxiosRequestConfig) => {
  const token = store.getState().signin.token;
  if (!config.headers.Authorization) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
    config.validateStatus = (status) => {
      return status === 200 || status === 201;
    };
  }
  return config;
}

axios.interceptors.request.use(authHeader);
axios.interceptors.response.use(response => {
  return response;
}, error => {
  if (error.response.status === 403) {
    redirectCallback();
  }
  return Promise.reject(error);
});
axios.defaults.baseURL = environment.apiEndpoint;

export async function signIn(signInRequest: SignInRequest): Promise<SignInResponse> {
  return axios.post<SignInResponse>(
    "/auth/login",
    signInRequest,
  ).then(response => response.data);
}

export async function getAccessTokenWithRefreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
  return axios.post<RefreshTokenResponse>(
    "/auth/refresh_token",
    null,
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    }
  ).then(response => response.data);
}
  


export async function workflows(namespace, searchTerm, page, rowsPerPage, sortBy, sortOrder) {
  return axios.get<PagedWorkflows | HTTPException>(
    `/api/v1/workflows?namespace=${namespace}&search=${searchTerm}&page=${page}&page_size=${rowsPerPage}&sort_by=${sortBy}&sort_order=${sortOrder}`,
  ).then(response => response.data);
}

export async function workflowStatus(namespace, workflowId: string | string[]) {
  const url = `/api/v1/workflow_status?namespace=${namespace}`;
  if (!Array.isArray(workflowId)) {
    workflowId = [workflowId];
  }
  const workflowIdString = workflowId.map(id => `workflow_id=${id}`).join("&");
  return axios.get<WorkflowStatus[] | HTTPException>(`${url}&${workflowIdString}`).then(response => response.data);
}

export async function workflowTasks(namespace, workflowId: string | string[], searchTerm: string, page: number, rowsPerPage: number, sortBy: string, sortOrder: string) {
  const url = `/api/v1/workflow_tasks?search=${searchTerm}&page=${page}&page_size=${rowsPerPage}&namespace=${namespace}`;
  if (!Array.isArray(workflowId)) {
    workflowId = [workflowId];
  }
  const workflowIdString = workflowId.map(id => `workflow_id=${id}`).join("&");
  return axios.get<PagedWorkflowTasks | HTTPException>(`${url}&${workflowIdString}`).then(response => response.data);
}

export async function handleWorkflow(namespace: string, action: string, workflowId: string) {
  const workflowAction = action === 'abort' ? 'abort_workflow' : action === 'restart' ? 'restart_workflow' : 'stop_workflow';
  return axios.post<HandleWorkflowResponse | HTTPException>(`/api/v1/${workflowAction}?namespace=${namespace}&workflow_id=${workflowId}`, {}).then(response => response.data);
}

export async function taskLogs(namespace, taskId: string, searchTerm: string, page: number, rowsPerPage: number) {
  return axios.get<PagedTaskLogs | HTTPException>(
    `/api/v1/task_logs?namespace=${namespace}&search=${searchTerm}&page=${page}&page_size=${rowsPerPage}&task_id=${taskId}`
  ).then(response => response.data);
}

export async function namespaces() {
  return axios.get<Namespace[] | HTTPException>("/api/v1/namespaces").then(response => response.data);
}

export async function disabledNamespaces() {
  return axios.get<Namespace[] | HTTPException>("/api/v1/namespaces/disabled").then(response => response.data);
}

export async function activeTasks(namespace: string, searchTerm: string, page: number, rowsPerPage: number) {
  return axios.get<PagedNodeTasks | HTTPException>(
    `/api/v1/active_tasks?namespace=${namespace}&search=${searchTerm}&page=${page}&page_size=${rowsPerPage}`
  ).then(response => response.data);
}

export async function startTask(namespace: string, node: string, task: string, taskArguments: any, tags: string[]) {
  return axios.post<HandleWorkflowResponse | HTTPException>(
    `/api/v1/new_task?namespace=${namespace}&node_name=${node}&task=${task}`,
    { 'arguments': taskArguments, 'tags': tags }
  ).then(response => response.data);
}

export async function nodeMetrics(namespace: string) {
  return axios.get<any>(`/api/v1/node_metrics?namespace=${namespace}`).then(response => response.data);
}

export async function workflowMetrics(namespace: string) {
  return axios.get<WorkflowMetrics[] | HTTPException>(`/api/v1/workflow_metrics?namespace=${namespace}`).then(response => response.data);
}

export async function rotateNamespacePassword(namespace: string) {
  return axios.post<string | HTTPException>(`/api/v1/namespace/${namespace}/credentials`).then(response => response.data);
}

export async function disableNamespace(namespace: string) {
  return axios.delete<string | HTTPException>(`/api/v1/namespace/${namespace}/disable`).then(response => response.data);
}

export async function enableNamespace(namespace: string) {
  return axios.put<string | HTTPException>(`/api/v1/namespace/${namespace}/enable`).then(response => response.data);
}

export async function createNamespace(namespace: string) {
  return axios.post<string | HTTPException>(`/api/v1/namespace/${namespace}`);
}

export async function allowUserToNamespace(namespace: string, user: string) {
  return axios.put<string | HTTPException>(`/api/v1/namespace/${namespace}/add_user`).then(response => response.data);
}

export async function removeUserFromNamespace(namespace: string, user: string) {
  return axios.put<string | HTTPException>(`/api/v1/namespace/${namespace}/remove_user`).then(response => response.data);
}

export async function deleteNamespace(namespace: string) {
  return axios.delete<string | HTTPException>(`/api/v1/namespace/${namespace}/delete`).then(response => response.data);
}