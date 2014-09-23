rmdir bin /S /Q
mkdir bin
mkdir bin\libs
type scripts\main.js scripts\sheet.js scripts\constants.js scripts\annotations\*.js scripts\controls\*.js scripts\tileview\*.js > bin\bluvue-sheet.js
java -jar C:\YUI-Compressor\yuicompressor-2.4.8.jar -o bin\bluvue-sheet.min.js bin\bluvue-sheet.js
copy style.css bin\style.css
copy libs\* bin\libs