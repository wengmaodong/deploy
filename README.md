配置文件地址：根目录下 deploy.config.json

```json
{
  "env": {
    "test": {
      "host": "10.111.111.114",
      "user": "root",
      "desc": "测试环境",
      "password": "123456"
    },
    "release": {
      "host": "111.161.111.191",
      "user": "root",
      "desc": "生产环境",
      "password": "",
      "proxy": {
        "host": "111.161.111.192",
        "user": "root",
        "desc": "生产环境跳板机",
        "password": ""
      }
    }
  },
  "projects": {
    "dataease_backend": {
      "root": "H:/work/adt-dataease-backend",
      "outDir": "target",
      "zipFile": "backend-1.16.0.jar",
      "desc": "dataease后端",
      "destRoot": "/data/app/dataease",
      "build_cmd": "mvn clean package",
      "start_cmd": "./shutdown.sh; sudo -i; ./start.sh;"
    }
  }
}
```
