#! /bin/sh

wget https://go.dev/dl/go1.18.3.linux-amd64.tar.gz
tar -C /usr/local -xzf go1.18.3.linux-amd64.tar.gz
export PATH=$PATH:/usr/local/go/bin

git clone https://github.com/mongodb/mongo-tools
./mongo-tools/make build

kubectl port-forward svc/example-mongodb-svc 27017:27017 &
mongorestore -u my-admin -p Start123 -h 127.0.0.1:27017 --db db --authenticationDatabase admin ./mongodb/db/