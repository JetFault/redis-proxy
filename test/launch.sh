#!/bin/bash

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

function start() {
	if [ -n "$1" ]; then
		echo "Starting redis$1.conf"
		mkdir -p /var/lib/redis/$1
		redis-server ${DIR}/redis${1}.conf
	fi

	if [ -n "$2" ]; then
		echo "Starting redis$2.conf"
		mkdir -p /var/lib/redis/$2
		redis-server ${DIR}/redis${2}.conf
	fi

	if [ -z "$1" ] && [ -z "$2" ]; then
		start "Master" "Slave"
	fi
}

function stop() {
	if [ -n "$1" ]; then
		echo "Killing redis$1.conf"
		pkill -9 -f "redis-server ${DIR}/redis${1}.conf"
	fi

	if [ -n "$2" ]; then
		echo "Killing redis$2.conf"
		pkill -9 -f "redis-server ${DIR}/redis${2}.conf"
	fi

	if [ -z "$1" ] && [ -z "$2" ]; then
		stop "Master" "Slave"
	fi
}

if [ "$1" == "start" ]; then
	start $2 $3;
elif [ "$1" == "restart" ]; then
	stop $2 $3;
	start $2 $3;
elif [ "$1" == "stop" ]; then
	stop $2 $3;
fi

	
