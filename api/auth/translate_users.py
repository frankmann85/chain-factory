from fastapi import Depends, APIRouter, HTTPException
from odmantic import AIOEngine
from httpx import AsyncClient
from json import dumps

from .models.translate_users_response import TranslateUsersResponse
from .models.translate_users_request import TranslateUsersRequest
from .utils.request import get_idp_credentials, get_odm_session, get_username
from .utils.https import get_https_certificates
from .depends import CheckScope
from .models.idp_domain_config import IdpDomainConfig
from .models.credentials import Credentials

api = APIRouter()


@api.post('/translate_users', dependencies=[Depends(CheckScope('auth'))])
async def translate_users(
    users_request: TranslateUsersRequest,
    database: AIOEngine = Depends(get_odm_session),
    idp_credentials: Credentials = Depends(get_idp_credentials),
    username: str = Depends(get_username),
):
    user_ids = users_request.user_ids
    if user_ids:
        headers = {'content-type': 'application/json'}
        idp_config_list = await IdpDomainConfig.get(database, username)
        if idp_config_list:
            # type hint for syntax highlighting
            idp_config: IdpDomainConfig = None
            async for idp_config in idp_config_list:
                if (
                    idp_config and
                    idp_config.endpoints and
                    idp_config.endpoints.translate_users_endpoint
                ):
                    client_certificates = await get_https_certificates(
                        idp_config.endpoints.translate_users_endpoint,
                        idp_config
                    )
                    async with AsyncClient(cert=client_certificates) as client:
                        translate_users_response = await client.post(
                            idp_config.endpoints.translate_users_endpoint,
                            data=dumps({
                                'username': idp_credentials.username,
                                'password': idp_credentials.password,
                                'user_ids': user_ids
                            }),
                            headers=headers
                        )
                    if translate_users_response.status_code == 200:
                        response_json = translate_users_response.json()
                        return TranslateUsersResponse(**response_json)
        raise HTTPException(
            status_code=404, detail='No idp endpoint found')
    raise HTTPException(
        status_code=400, detail='the following keys are null: user_ids')
