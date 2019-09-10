'use strict';

const http = require('http');
const https = require('https');
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
            'before:remove:remove': () => bb.bind(this).then(this.delete),
            'httpDownload:download': () => bb.bind(this).then(this.download)
        };
    }

    download() {
        const cli = this.serverless.cli;
        const httpDownloads = this.serverless.service.custom.http.downloads;
        cli.consoleLog(httpDownloads)
        if (!Array.isArray(httpDownloads)) {
            cli.consoleLog(`${messagePrefix}${chalk.red('No configuration found')}`)
            return Promise.resolve();
        }
        cli.consoleLog(`${messagePrefix}${chalk.yellow('Starting File Downloads.')}`);
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
            return new Promise((resolve) => {
                if (!fs.existsSync(localPath)){
                    fs.mkdirSync(localPath, { recursive: true });
                }
                var slash = '';
                if (!localPath.endsWith("/") || !localPath.endsWith("\\")) {
                    slash = '/';
                }
                var destFile = localPath + slash + localFileName
                var file = fs.createWriteStream(destFile);
                var client = http;
                if (httpUrl.toUpperCase().startsWith("HTTPS")) {
                    client = https;
                }
                var request = client.get(httpUrl, function(response) {
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
                    resolve('Done');
                }
            });
        });
        return Promise.all(promises)
            .then(() => {
            cli.printDot();
            cli.consoleLog('');
            cli.consoleLog(`${messagePrefix}${chalk.yellow('All Files Downloaded.')}`);
        });    
    }

    delete() {
        const cli = this.serverless.cli;
        const httpDownloads = this.serverless.service.custom.http.downloads;
        cli.consoleLog(httpDownloads)
        if (!Array.isArray(httpDownloads)) {
            cli.consoleLog(`${messagePrefix}${chalk.red('No configuration found')}`)
            return Promise.resolve();
        }
        cli.consoleLog(`${messagePrefix}${chalk.yellow('Removing Locally Downloaded Files.')}`);
        const promises = httpDownloads.map((s) => {
            let localPath = null;
            if (s.hasOwnProperty('localPath')) {
                localPath = s.localPath;
            }
            let localFileName = null;
            if (s.hasOwnProperty('localFileName')) {
                localFileName = s.localFileName;
            }
            if (localPath === null || localFileName === null) {
                return Promise.resolve();
            }
            return new Promise((resolve) => {
                var destFile = localPath + slash + localFileName
                if (!fs.existsSync(destFile)){
                    fs.unlink('path/file.txt', (err) => {
                        if (err) throw err;
                        fileDeleted();
                    });
                }
                function fileDeleted() {
                    cli.printDot();
                    resolve('Done');
                }
            });
        });
        return Promise.all(promises)
            .then(() => {
            cli.printDot();
            cli.consoleLog('');
            cli.consoleLog(`${messagePrefix}${chalk.yellow('All Locally Downloaded Files Removed.')}`);
        });
    }
}

module.exports = ServerlessHttpDownload;