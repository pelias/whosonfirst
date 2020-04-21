#!/bin/bash
set -euo pipefail
IFS=$'\n\t'

# whosonfirst sqlite database downloader
# this script handles the download & extract of whosonfirst bundles.
# an additonal '.timestamp' file is saved next to the extracted database
# in order to avoid re-downloading the same file on subsequent executions.

# input params:
# $1) name of database without path or bz2 suffix
#  eg. 'whosonfirst-data-postalcode-ad-latest.db'
# $2) absolute path of database without bz2 suffix
#  eg. '/tmp/whosonfirst-data-postalcode-ad-latest.db'

# you can find a list of available bundles at:
# https://geocode.earth/data/whosonfirst

DB_FILENAME="$1"
LOCAL_DB_PATH="$2"
LOCAL_BZ2_PATH="$2.bz2"
LOCAL_TS_PATH="${LOCAL_DB_PATH}.timestamp"
REMOTE='https://data.geocode.earth/wof/dist/sqlite'
REMOTE_PATH="${REMOTE}/${DB_FILENAME}.bz2"

info() { echo -e "\e[33m[$1]\t\e[0m $2" >&2; }
err() { echo -e "\e[31m[$1]\t\e[0m \e[91m$2\e[0m" >&2; }

# Check if we have lbzip2 (https://lbzip2.org/) installed
decompress_utility() {
  if hash lbunzip2 2>/dev/null; then
    lbunzip2 -d -f "${LOCAL_BZ2_PATH}" > "${LOCAL_DB_PATH}"
  else
    bunzip2 -f "${LOCAL_BZ2_PATH}" > "${LOCAL_DB_PATH}"
  fi
}
extract_file() {
  info 'whosonfirst-sqlite-decompress' "${LOCAL_BZ2_PATH}"
  decompress_utility
}
generate_timestamp() {
  printf "@" > "${LOCAL_TS_PATH}" # date command requires @ prefix
  stat -c %Y "${LOCAL_DB_PATH}" >> "${LOCAL_TS_PATH}"
}
download_handler() {
  HTTP_STATUS="${1}"
  if [[ "${HTTP_STATUS}" == "200" ]]; then
    extract_file && generate_timestamp
  elif [[ "${HTTP_STATUS}" == "304" ]]; then
    info 'not modified' "${DB_FILENAME}"
  else
    rm -f "${LOCAL_BZ2_PATH}"
    err "status ${HTTP_STATUS}" "${REMOTE_PATH}"
  fi
}
download_sqlite_db() {
  info 'whosonfirst-sqlite-download' "${REMOTE_PATH}"
  if [[ ! -f "${LOCAL_TS_PATH}" ]]; then
    # first download
    download_handler $(curl "${REMOTE_PATH}" \
      -o "${LOCAL_BZ2_PATH}" -s -L -w %{http_code})
  else
    # subsequent download
    LAST_MODIFIED=$(date --rfc-2822 -f "${LOCAL_TS_PATH}")
    download_handler $(curl -s "${REMOTE_PATH}" \
      -z "${LAST_MODIFIED}" \
      -o "${LOCAL_BZ2_PATH}" -s -L -w %{http_code})
  fi
}

download_sqlite_db;
