'use strict';

const http = require('http');
const fs = require('fs');
const bb = require('bluebird');
const chalk = require('chalk');

const messagePrefix = 'HTTP Download: ';

class ServerlessHttpDownload {

    constructor(serverless, options) {
        this.serverless = serverless;
        this.options = options || {};

        this.commands = {
            httpDownload: {
              usage: 'Download file(s) from HTTP',
              lifecycleEvents: [
                'download'
              ]
            }
          };

        this.hooks = {
            'before:deploy:deploy': () => bb.bind(this).then(this.download),
            'httpDownload:download': () => bb.bind(this).then(this.download)
        };

    }

    download() {
        const httpDownloads = this.serverless.service.http.downloads;
        cli.consoleLog(httpDownloads)
        const cli = this.serverless.cli;
        if (!Array.isArray(httpDownloads)) {
            cli.consoleLog(`${messagePrefix}${chalk.red('No configuration found')}`)
            return Promise.resolve();
        }
        const promises = httpDownloads.map((s) => {
            let httpUrl = null;
            if (s.hasOwnProperty('httpUrl')) {
                httpUrl = s.httpUrl;
            }
            let localPath = null;
            if (s.hasOwnProperty('localPath')) {
                localPath = s.localPath;
            }
            let localFileName = null;
            if (s.hasOwnProperty('localFileName')) {
                localFileName = s.localFileName;
            }
            if (httpUrl === null || localPath === null || localFileName === null) {
                return Promise.resolve();
            }
            if (!fs.existsSync(localPath)){
                fs.mkdirSync(localPath);
            }
            var destFile = localPath + localFileName
            var file = fs.createWriteStream(destFile);
            var request = http.get(httpUrl, function(response) {
                response.pipe(file);
                file.on('finish', function() {
                    file.close(downloadComplete);
                });
            });
            request.on('error', function(err) {
                fs.unlink(destFile);
                cli.consoleLog(`${messagePrefix}${chalk.red('Error downloading File: ' )}${httpUrl}`)
                throw new Error("Unable to download file.", err);
            });
            function downloadComplete() {
                cli.printDot();
                resolve('Done')
            }
        });
        return Promise.all(promises)
            .then(() => {
            cli.printDot();
            cli.consoleLog('');
            cli.consoleLog(`${messagePrefix}${chalk.yellow('All Files Downloaded.')}`);
        });    
    }

}

module.exports = ServerlessHttpDownload;