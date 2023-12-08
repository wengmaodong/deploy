#!/usr/bin/env node

const shell = require("shelljs");
const path = require("path");
const dayjs = require("dayjs");
const args = require("minimist")(process.argv.slice(2));

/** 修复中文乱码 */
shell.exec(`chcp 65001`);

const configPath = path.resolve(process.cwd(), "./deploy.config.json");

// 版本
const version = args.v || args.version || dayjs().format("YYYYMMDD");

// 环境
const env = args.e || args.env;
const project = args.p || args.project;
let config = null;
let filename = `${version}.zip`;

// 跳过打包，生产发布时不一定需要打包
const needBuild = args.b || args.build || false;
let envConfig = null;
let projectConfig = null;

const validateConfig = () => {
  if (!project) {
    shell.echo("请指定项目名称");
    shell.exit(1);
  }
  if (!envConfig) {
    shell.echo(`指定的环境配置不存在：${env}`);
    shell.exit(1);
  }

  if (!projectConfig) {
    shell.echo(`指定的项目配置不存在：${project}`);
    shell.exit(1);
  }
};

const exec = (cmd, successMsg) => {
  shell.echo(`执行命令：${cmd}`);
  const { code, stdout } = shell.exec(cmd);
  if (code === 0) {
    shell.echo(successMsg || `执行成功`);
  } else {
    shell.echo(stdout);
    shell.exit(1);
  }
};

/** 压缩文件 */
const zipFiles = () => {
  try {
    const { root, outDir, zipFile } = projectConfig;
    shell.cd(root);
    shell.cd(outDir);

    if (zipFile) {
      filename = `${zipFile}.${filename}`;
    }

    shell.echo(`开始生成zip文件 ${filename} ...`);
    exec(`zip -r -D ${filename} ${zipFile || "*"}`);

    shell.echo(`生成zip文件成功`);
  } catch (e) {
    shell.echo(`压缩文件失败：${e}`);
    shell.exit(1);
  }
};

/** 打包 */
const buildProject = () => {
  try {
    const { build_cmd, root } = projectConfig;
    if (!build_cmd) {
      shell.echo(`项目${project}的打包命令不存在`);
      shell.exit(1);
    }
    shell.cd(root);
    shell.echo("开始打包项目");
    exec(build_cmd);
    shell.echo("打包项目完成");
  } catch (e) {
    shell.echo(`打包项目失败：${e}`);
    shell.exit(1);
  }
};

const createProxy = () => {
  const {
    proxy: { user, host, desc },
  } = envConfig;
  shell.echo(`开始启动代理: ${desc} ${user}@${host}...`);
  const proxyCmd = `ssh -Nfg -D 1080 ${user}@${host}`;

  exec(proxyCmd);
  shell.echo(`代理启动成功\n`);
  return () => {
    const pid = shell
      .exec(`ps -ef | grep "${proxyCmd}" | grep -v grep | awk '{print $2}'`, {
        silent: true,
      })
      .stdout.trim();
    shell.echo(`pid: ${pid}`);
    if (pid) {
      shell.echo("关闭代理");
      exec(`kill -9 ${pid}`);
    }
  };
};

/** 上传文件 */
const uploadFiles = () => {
  try {
    const { root, outDir, destRoot, start_cmd } = projectConfig;
    const { host, proxy, desc, user, password } = envConfig;
    let proxyOpt = "";
    let closeProxy;
    const remote = `${user}@${host}`;
    const remoteAddr = `${remote}:${destRoot}`;
    if (proxy) {
      closeProxy = createProxy();
      proxyOpt = '-o ProxyCommand="nc -X 5 -x 127.0.0.1:1080 %h %p"';
    }
    shell.cd(root);
    shell.cd(outDir);
    shell.echo(`开始上传文件: ${desc} 【${remoteAddr}】`);

    exec(`scp ${proxyOpt} ${filename} ${remoteAddr}/${version}.zip`);

    // 解压文件
    shell.echo(`开始解压文件: ${desc} 【${remoteAddr}】`);
    shell.exec(
      `ssh -n ${proxyOpt} ${remote} "sudo -i; cd ${destRoot}; unzip -o ${version}.zip; ${
        start_cmd || ""
      } exit 0;"`
    );
    shell.echo("文件解压成功");

    // 关闭代理
    closeProxy && closeProxy();
  } catch (e) {
    shell.echo(`上传文件失败：${e}`);
    shell.exit(1);
  }
};

const start = () => {
  //检查控制台是否可以运行`git `开头的命令
  if (!shell.which("git")) {
    //在控制台输出内容
    shell.echo("请先安装git");
    shell.exit(1);
  }

  if (!shell.which("ssh")) {
    //在控制台输出内容
    shell.echo("请先安装ssh");
    shell.exit(1);
  }

  
  if (!shell.which("zip") || !shell.which("unzip")) {
    //在控制台输出内容
    shell.echo("请先安装 zip 和 unzip 命令");
    shell.exit(1);
  }

  try {
    const file = require.resolve(configPath);
  } catch (e) {
    shell.echo("获取配置文件失败：" + configPath);
    console.log(e);
  }

  config = require(configPath);
  envConfig = config.env[env];
  projectConfig = config.projects[project];

  validateConfig();

  const { desc } = projectConfig;
  shell.echo(`开始部署项目【${desc}】，环境【${env}】，版本【${version}】`);

  if (needBuild) {
    buildProject();
    zipFiles();
  }

  uploadFiles();

  shell.echo("部署成功");
};

module.exports = {
  start,
};
