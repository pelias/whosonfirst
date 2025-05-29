# base image
FROM pelias/baseimage:nodejs-20

# change working dir
ENV WORKDIR=/code/pelias/whosonfirst
WORKDIR ${WORKDIR}

# copy package.json first to prevent npm install being rerun when only code changes
COPY ./package.json ${WORKDIR}
RUN npm install

# add code from local checkout
ADD . ${WORKDIR}

# run tests
RUN npm test

# run as the pelias user
USER pelias
