interface Env {
  /**
   * 主机地址
   * @example 172.16.99.91
   */
  host: string;

  /**
   * 登录用户
   * @example root
   */
  user: string;

  /**
   * 描述
   * @example xx后台正式环境
   */
  desc: string;

  /**
   * 密码，可以配置免登录 用 [ssh-copy-id] 命令上传密钥
   * @example 12344
   */
  password?: string;

  /**
   * 代理，跳板机配置，配置了代理会自动开启隧道
   */
  proxy?: Env;
}

interface Project {
  /**
   * 项目本地地址
   * @example H:/study/vite-react
   */
  root: string;

  /**
   * 压缩文件输出目录
   * @example dist
   */
  outDir: string;

  /**
   * 项目描述
   * @example xx后台管理系统
   */
  desc: string;

  /**
   * 远程服务器部署路径
   * @example /data/app/front-end/adt
   */
  destRoot: string;

  /**
   * 打包命令
   * @example pnpm run build
   */
  build_cmd?: string;

  /**
   * 启动命令
   * @example "sudo -i; ./start.sh;"
   */
  start_cmd?: string;
}

/**
 * 部署配置
 */
interface DeployConfig {
  env: Record<string, Env>;
  projects: Record<string, Project>;
}
