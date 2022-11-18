#to start the script run: nohup ./startSparqlUi.sh > sparqlUiOutput.txt 2>&1
#the actuall process is running with the name http-server (so to kill it do, pgrep -a http-server, and kill <PID> . It is because the npm start starts a script from the package.json file, and that script is the http-server configured over a grunt script (Gruntfile.js)
npm start &
