export interface PermPreset {
  octal: string;
  symbolic: string;
  name: string;
  type: '-' | 'd';
  risk: 'safe' | 'warning' | 'danger' | 'info';
  usage: string;
  command: string;
  description: string;
}

export const PRESET_PERMISSIONS: PermPreset[] = [
  {
    octal: '755',
    symbolic: 'rwxr-xr-x',
    name: '标准程序 / 目录通用权限',
    type: 'd',
    risk: 'safe',
    usage: '系统命令 (/bin), 公共脚本, Web站点目录, 应用程序根目录',
    command: 'chmod 755 /var/www/html',
    description: '属主拥有完全控制权，组和其他用户可穿透进入与读取，但禁止修改或删除。',
  },
  {
    octal: '644',
    symbolic: 'rw-r--r--',
    name: '标准文本 / 配置文件通用权限',
    type: '-',
    risk: 'safe',
    usage: '系统配置文件 (/etc/hosts), Web静态资源 (html/css/png), 日志只读分发',
    command: 'chmod 644 /etc/nginx/nginx.conf',
    description: '属主可读可写，其他所有人只读，杜绝非授权篡改。',
  },
  {
    octal: '600',
    symbolic: 'rw-------',
    name: '私密文件 / 认证凭据',
    type: '-',
    risk: 'safe',
    usage: 'SSH 私钥 (~/.ssh/id_rsa), 数据库密码配置 (.env), GPG 私钥',
    command: 'chmod 600 ~/.ssh/id_rsa',
    description: '仅属主本人可读可写，对任何其他组或用户完全屏蔽，是高敏感机密的防线。',
  },
  {
    octal: '700',
    symbolic: 'rwx------',
    name: '私密目录 / 用户私有空间',
    type: 'd',
    risk: 'safe',
    usage: '~/.ssh 目录, /root 管理员家目录, 加密数据存放目录',
    command: 'chmod 700 ~/.ssh',
    description: '仅属主能够进入、读取和在其中新建文件，完全隔绝其他所有非特权用户。',
  },
  {
    octal: '1777',
    symbolic: 'rwxrwxrwt',
    name: '粘滞位共享目录 (Sticky Bit)',
    type: 'd',
    risk: 'info',
    usage: '/tmp, /var/tmp 临时公共缓存区',
    command: 'chmod 1777 /tmp',
    description: '所有人皆可读写创建文件，但受粘滞位保护：非属主用户无法删除他人的文件。',
  },
  {
    octal: '2775',
    symbolic: 'rwxrwsr-x',
    name: '协同工作组共享目录 (SGID)',
    type: 'd',
    risk: 'info',
    usage: '团队 Git 仓库, 多人协作开发目录 (/data/team)',
    command: 'chmod 2775 /data/team && chown :devteam /data/team',
    description: '组内成员享有完全读写权，且目录下新建的所有文件会自动继承该目录的属组。',
  },
  {
    octal: '4755',
    symbolic: 'rwsr-xr-x',
    name: '特权提升可执行程序 (SUID)',
    type: '-',
    risk: 'warning',
    usage: '/usr/bin/passwd, /usr/bin/sudo, /bin/ping',
    command: 'chmod 4755 /usr/bin/tool',
    description: '运行该程序时进程将临时获得文件所有者 (通常为 root) 的特权，需极为谨慎防范漏洞。',
  },
  {
    octal: '400',
    symbolic: 'r--------',
    name: '绝对只读绝密文件',
    type: '-',
    risk: 'safe',
    usage: '云平台 SSH 密钥文件, 归档备份静态证书',
    command: 'chmod 400 ~/.ssh/server.pem',
    description: '连属主也只能只读读取，防止意外重定向或误编辑覆盖。',
  },
  {
    octal: '777',
    symbolic: 'rwxrwxrwx',
    name: '完全开放权限 (严重安全隐患)',
    type: '-',
    risk: 'danger',
    usage: '极少数测试临时调试（排查完必须立即撤销）',
    command: 'chmod 777 /path/to/test (慎用!)',
    description: '任何人都可以读取、写入、执行或覆盖，极易导致恶意代码注入和数据泄漏。',
  },
];
