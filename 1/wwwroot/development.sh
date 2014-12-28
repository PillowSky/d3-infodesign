#!/bin/bash
coffee --watch --compile js/*.coffee&
jade -w -P *.jade&

echo "The development environment has ready!"
