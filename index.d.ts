declare module "samba-client" {
  interface ISambaClientOptions {
    readonly address: string;
    readonly username?: string;
    readonly password?: string;
    readonly domain?: string;
    readonly port?: number;
    readonly timeout?: number;
    readonly maxProtocol?: string;
    readonly maskCmd?: boolean;
  }

  interface ISambaItem {
    readonly name: string;
    readonly type: string;
    readonly size: number;
    readonly modifyTime: Date;
  }

  class SambaClient {
    constructor(options: ISambaClientOptions);

    getFile: (
      path: string,
      destination: string,
      workingDir?: string
    ) => Promise<string | Buffer>;
    sendFile: (path: string, destination: string) => Promise<string | Buffer>;
    deleteFile: (fileName: string) => Promise<string | Buffer>;
    listFiles: (
      fileNamePrefix: string,
      fileNameSuffix: string
    ) => Promise<string[]>;
    mkdir: (remotePath: string, cwd?: string) => Promise<string | Buffer>;
    dir: (remotePath: string, cwd?: string) => Promise<string | Buffer>;
    fileExists: (remotePath: string, cwd?: string) => Promise<boolean>;
    cwd: () => Promise<string>;
    list: (remotePath: string) => Promise<ISambaItem[]>;
    execute: (
      smbCommand: string,
      smbCommandArgs: string | string[],
      workingDir?: string
    ) => Promise<string | Buffer>;
    getAllShares: () => Promise<string[]>;
  }

  export = SambaClient;
}
