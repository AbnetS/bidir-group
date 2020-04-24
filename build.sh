#!/usr/bin/env bash
DOCKER_PATH=$(which docker)
DEPLOYMENT_ENV=`hostname | awk -F - '{print $2}'`
SERVICE_NAME=$DEPLOYMENT_ENV-group-api
IMAGE_TAG=bidir/$SERVICE_NAME
EXPOSE_PORT=8100
CONT_PORT=8100
LOAN_PORT = 8110
HOST_IP=`ifconfig ens4 | awk '/inet addr/{print substr($2,6)}'`

MONGODB_URL=mongodb://$HOST_IP:27017/bidir
BASE_API_URL='http://api.dev.bidir.gebeya.co'

LOAN_API_URL = $HOST_IP:$LOAN_PORT/loans
# Stop running container
$DOCKER_PATH stop $SERVICE_NAME
# Remove container
$DOCKER_PATH rm $SERVICE_NAME
# Remove previous image
$DOCKER_PATH rmi $IMAGE_TAG
# Build image
$DOCKER_PATH build -t $IMAGE_TAG .
# Build the container
$DOCKER_PATH run -d \
  --name $SERVICE_NAME \
  -p $HOST:$EXPOSE_PORT:$CONT_PORT \
  -e HOST=$HOST_IP \
  -e MONGODB_URL=$MONGODB_URL \
  -e BASE_API_URL=$BASE_API_URL \
  -e LOAN_API_URL=$LOAN_API_URL \
  --restart=always \
  $IMAGE_TAG

