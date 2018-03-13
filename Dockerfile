# base image
FROM pelias/baseimage

# downloader apt dependencies
# note: this is done in one command in order to keep down the size of intermediate containers
RUN apt-get update && apt-get install -y autoconf automake libtool pkg-config python bzip2 unzip && rm -rf /var/lib/apt/lists/*

# change working dir
ENV WORKDIR /code/pelias/whosonfirst
WORKDIR ${WORKDIR}

# add code from local checkout
ADD . ${WORKDIR}

# install npm dependencies
RUN npm install

# run tests
RUN npm test
