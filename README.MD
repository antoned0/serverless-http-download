# Serverless HTTP Download

> A plugin to download files from HTTP/HTTPS to a local directory before deploy.

## Use Case

- Download files to local folder that may be needed during serverless deploy.

## Install

Run `npm install` in your Serverless project.

```sh
$ npm install --save https://github.com/antoned0/serverless-http-download
```

Add the plugin to your serverless.yml file

```yaml
plugins:
  - serverless-http-download
```

## Setup

```yaml
custom:
  http:
    downloads:
      -  httpUrl: File_to_download_url
         localPath: Local_Path_To_Save_File_In
         localFileName: Local_Filename_To_Save_As
```

## Usage

Run `sls deploy`, Files are downloaded before deploy.

Run `sls remove`, Files (if they exist) are removed.

Run `sls httpDownload`, Files are downloaded only.