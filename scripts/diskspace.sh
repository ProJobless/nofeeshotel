#!/bin/sh

df=`df -Pl  | grep "^/dev" | awk '{print $5, $6}' | sed "s/%//"`

echo "$df" | while read percent fs
do

if [ $percent -ge 90 ] ; then

/usr/bin/sudo /opt/scripts/clearoscache.sh
echo "clearoscache"

fi
done
