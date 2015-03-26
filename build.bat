rmdir ..\bin /S /Q
mkdir ..\bin
mkdir ..\bin\scripts
mkdir ..\bin\template
mkdir ..\bin\Content
type scripts\constants.js scripts\main.js scripts\dataTypes.js scripts\orderByObjectFilter.js scripts\sheet.js scripts\annotations\*.js scripts\controls\*.js scripts\tileview\*.js > ..\bin\scripts\bluvue-sheet.js
java -jar C:\YUI-Compressor\yuicompressor-2.4.8.jar -o ..\bin\scripts\bluvue-sheet.min.js ..\bin\scripts\bluvue-sheet.js
copy style.css ..\bin\Content\bluvue-sheet.css
copy template\bluvue-sheet.html ..\bin\template\bluvue-sheet.html
copy libs\* ..\bin\scripts\
xcopy images\update\* ..\bin\images\update\ /s