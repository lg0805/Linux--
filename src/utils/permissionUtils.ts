import {
  FileType,
  FullPermissionState,
  PermissionTriple,
  SpecialPermissions,
  ActionType,
  PermissionEvaluationResult,
} from '../types';

export const FILE_TYPE_NAMES: Record<FileType, { name: string; desc: string }> = {
  '-': { name: '普通文件 (Regular File)', desc: '文本文件、二进制可执行程序、压缩包等数据载体' },
  'd': { name: '目录 (Directory)', desc: '包含文件名与对应 inode 映射关系的文件夹' },
  'l': { name: '符号链接 (Symlink)', desc: '指向另一个目标路径的软链接快捷方式' },
  's': { name: '套接字 (Socket)', desc: '用于进程间双向本地网络通信的特殊文件' },
  'p': { name: '命名管道 (FIFO Pipe)', desc: '用于进程间单向数据管道通信' },
  'c': { name: '字符设备 (Character Device)', desc: '按字符流访问的硬件设备接口（如 /dev/tty, /dev/null）' },
  'b': { name: '块设备 (Block Device)', desc: '按数据块缓存读写的存储设备（如 /dev/sda, /dev/nvme0n1）' },
};

export function tripleToOctal(triple: PermissionTriple): number {
  return (triple.read ? 4 : 0) + (triple.write ? 2 : 0) + (triple.execute ? 1 : 0);
}

export function octalToTriple(val: number): PermissionTriple {
  const clamped = Math.max(0, Math.min(7, Math.floor(val)));
  return {
    read: (clamped & 4) !== 0,
    write: (clamped & 2) !== 0,
    execute: (clamped & 1) !== 0,
  };
}

export function specialToOctal(special: SpecialPermissions): number {
  return (special.suid ? 4 : 0) + (special.sgid ? 2 : 0) + (special.sticky ? 1 : 0);
}

export function octalToSpecial(val: number): SpecialPermissions {
  const clamped = Math.max(0, Math.min(7, Math.floor(val)));
  return {
    suid: (clamped & 4) !== 0,
    sgid: (clamped & 2) !== 0,
    sticky: (clamped & 1) !== 0,
  };
}

export function toSymbolicString(state: FullPermissionState): string {
  const { fileType, user, group, others, special } = state;

  // User triple
  const uR = user.read ? 'r' : '-';
  const uW = user.write ? 'w' : '-';
  let uX = user.execute ? 'x' : '-';
  if (special.suid) {
    uX = user.execute ? 's' : 'S';
  }

  // Group triple
  const gR = group.read ? 'r' : '-';
  const gW = group.write ? 'w' : '-';
  let gX = group.execute ? 'x' : '-';
  if (special.sgid) {
    gX = group.execute ? 's' : 'S';
  }

  // Others triple
  const oR = others.read ? 'r' : '-';
  const oW = others.write ? 'w' : '-';
  let oX = others.execute ? 'x' : '-';
  if (special.sticky) {
    oX = others.execute ? 't' : 'T';
  }

  return `${fileType}${uR}${uW}${uX}${gR}${gW}${gX}${oR}${oW}${oX}`;
}

export function toOctalString(state: FullPermissionState, forceFourDigits = false): string {
  const s = specialToOctal(state.special);
  const u = tripleToOctal(state.user);
  const g = tripleToOctal(state.group);
  const o = tripleToOctal(state.others);

  if (s > 0 || forceFourDigits) {
    return `${s}${u}${g}${o}`;
  }
  return `${u}${g}${o}`;
}

export function toBinaryString(state: FullPermissionState): string {
  const bits: string[] = [];
  const s = specialToOctal(state.special).toString(2).padStart(3, '0');
  const u = tripleToOctal(state.user).toString(2).padStart(3, '0');
  const g = tripleToOctal(state.group).toString(2).padStart(3, '0');
  const o = tripleToOctal(state.others).toString(2).padStart(3, '0');

  if (specialToOctal(state.special) > 0) {
    bits.push(s);
  }
  bits.push(u, g, o);
  return bits.join(' ');
}

export function parseOctalInput(input: string, currentState: FullPermissionState): FullPermissionState | null {
  const clean = input.trim();
  if (!/^[0-7]{3,4}$/.test(clean)) {
    return null;
  }

  let specialDigit = 0;
  let userDigit = 0;
  let groupDigit = 0;
  let othersDigit = 0;

  if (clean.length === 3) {
    userDigit = parseInt(clean[0], 10);
    groupDigit = parseInt(clean[1], 10);
    othersDigit = parseInt(clean[2], 10);
  } else {
    specialDigit = parseInt(clean[0], 10);
    userDigit = parseInt(clean[1], 10);
    groupDigit = parseInt(clean[2], 10);
    othersDigit = parseInt(clean[3], 10);
  }

  return {
    ...currentState,
    special: octalToSpecial(specialDigit),
    user: octalToTriple(userDigit),
    group: octalToTriple(groupDigit),
    others: octalToTriple(othersDigit),
  };
}

export function parseSymbolicInput(input: string, currentState: FullPermissionState): FullPermissionState | null {
  const clean = input.trim();
  if (clean.length === 9) {
    // e.g. rwxr-xr--
    return parse9CharSymbolic(clean, currentState);
  }
  if (clean.length === 10) {
    // e.g. -rwxr-xr-- or drwxr-xr-x
    const typeChar = clean[0] as FileType;
    const validTypes: FileType[] = ['-', 'd', 'l', 's', 'p', 'c', 'b'];
    if (!validTypes.includes(typeChar)) return null;

    const parsed = parse9CharSymbolic(clean.substring(1), currentState);
    if (!parsed) return null;
    return {
      ...parsed,
      fileType: typeChar,
    };
  }
  return null;
}

function parse9CharSymbolic(perms: string, currentState: FullPermissionState): FullPermissionState | null {
  const uR = perms[0];
  const uW = perms[1];
  const uX = perms[2];
  const gR = perms[3];
  const gW = perms[4];
  const gX = perms[5];
  const oR = perms[6];
  const oW = perms[7];
  const oX = perms[8];

  const isValidChar = (c: string, expected: string) => c === '-' || c === expected;
  if (!isValidChar(uR, 'r') || !isValidChar(uW, 'w')) return null;
  if (!isValidChar(gR, 'r') || !isValidChar(gW, 'w')) return null;
  if (!isValidChar(oR, 'r') || !isValidChar(oW, 'w')) return null;

  const suid = uX === 's' || uX === 'S';
  const uExec = uX === 'x' || uX === 's';
  if (!uExec && uX !== '-' && uX !== 'S') return null;

  const sgid = gX === 's' || gX === 'S';
  const gExec = gX === 'x' || gX === 's';
  if (!gExec && gX !== '-' && gX !== 'S') return null;

  const sticky = oX === 't' || oX === 'T';
  const oExec = oX === 'x' || oX === 't';
  if (!oExec && oX !== '-' && oX !== 'T') return null;

  return {
    ...currentState,
    special: {
      suid,
      sgid,
      sticky,
    },
    user: {
      read: uR === 'r',
      write: uW === 'w',
      execute: uExec,
    },
    group: {
      read: gR === 'r',
      write: gW === 'w',
      execute: gExec,
    },
    others: {
      read: oR === 'r',
      write: oW === 'w',
      execute: oExec,
    },
  };
}

export interface UmaskCalculation {
  umaskOctal: number;
  umaskStr: string;
  // Directory deduction
  dirBaseOctal: number; // 0777
  dirBaseStr: string;
  dirResultOctal: number;
  dirResultStr: string;
  dirSymbolic: string;
  // File deduction
  fileBaseOctal: number; // 0666
  fileBaseStr: string;
  fileResultOctal: number;
  fileResultStr: string;
  fileSymbolic: string;
  // Bitwise details
  bitwiseFileExplanation: string;
}

export function calculateUmask(umaskInput: number): UmaskCalculation {
  const umask = umaskInput & 0o777;
  const umaskStr = umask.toString(8).padStart(3, '0');

  // Directories: default maximum 0777 & ~umask
  const dirBaseOctal = 0o777;
  const dirResultOctal = dirBaseOctal & ~umask;
  const dirResultStr = dirResultOctal.toString(8).padStart(3, '0');

  // Files: default maximum 0666 & ~umask (POSIX files do not get execute bit by default)
  const fileBaseOctal = 0o666;
  const fileResultOctal = fileBaseOctal & ~umask;
  const fileResultStr = fileResultOctal.toString(8).padStart(3, '0');

  const dirTripleU = octalToTriple((dirResultOctal >> 6) & 7);
  const dirTripleG = octalToTriple((dirResultOctal >> 3) & 7);
  const dirTripleO = octalToTriple(dirResultOctal & 7);
  const dirState: FullPermissionState = {
    fileType: 'd',
    user: dirTripleU,
    group: dirTripleG,
    others: dirTripleO,
    special: { suid: false, sgid: false, sticky: false },
    filename: 'new_dir',
    owner: 'user',
    groupName: 'user',
    sizeBytes: 4096,
  };

  const fileTripleU = octalToTriple((fileResultOctal >> 6) & 7);
  const fileTripleG = octalToTriple((fileResultOctal >> 3) & 7);
  const fileTripleO = octalToTriple(fileResultOctal & 7);
  const fileState: FullPermissionState = {
    fileType: '-',
    user: fileTripleU,
    group: fileTripleG,
    others: fileTripleO,
    special: { suid: false, sgid: false, sticky: false },
    filename: 'new_file.txt',
    owner: 'user',
    groupName: 'user',
    sizeBytes: 0,
  };

  return {
    umaskOctal: umask,
    umaskStr,
    dirBaseOctal,
    dirBaseStr: '0777 (rwxrwxrwx)',
    dirResultOctal,
    dirResultStr,
    dirSymbolic: toSymbolicString(dirState),
    fileBaseOctal,
    fileBaseStr: '0666 (rw-rw-rw-)',
    fileResultOctal,
    fileResultStr,
    fileSymbolic: toSymbolicString(fileState),
    bitwiseFileExplanation: `计算公式为位运算: 0666 & (~0${umaskStr})。常见偶数掩码(如022)结果与算术相减(666-022=644)一致；若掩码含奇数(如023)，算术相减为643，但真正内核位运算为 666 & ~023 = 644，因为普通文件初始根本没有 x 执行位可供剥夺！`,
  };
}

export function evaluatePOSIXAction(params: {
  currentUser: string;
  currentUserGroups: string[];
  isRoot: boolean;
  action: ActionType;
  parentDir: {
    owner: string;
    group: string;
    user: PermissionTriple;
    groupPerm: PermissionTriple;
    others: PermissionTriple;
    sticky: boolean;
  };
  targetFile?: {
    owner: string;
    group: string;
    user: PermissionTriple;
    groupPerm: PermissionTriple;
    others: PermissionTriple;
    special: SpecialPermissions;
  };
}): PermissionEvaluationResult {
  const { currentUser, currentUserGroups, isRoot, action, parentDir, targetFile } = params;

  const steps: PermissionEvaluationResult['steps'] = [];

  // 1. Root check
  if (isRoot) {
    if (action === 'file_execute' && targetFile) {
      // Root requires at least one 'x' bit set anywhere on file to execute binary/script
      const hasAnyExec = targetFile.user.execute || targetFile.groupPerm.execute || targetFile.others.execute;
      if (!hasAnyExec) {
        return {
          allowed: false,
          exitCode: 126,
          reason: '即使是超级管理员 root 用户，若文件没有任何一位执行权限 (u/g/o 均无 x)，内核也会拒绝执行！',
          kernelRule: 'POSIX 标准安全机制：防止 root 意外执行普通数据文件',
          steps: [
            {
              title: 'Root 特权检查',
              description: '当前主体为 root (UID 0)，拥有全局读写豁免权',
              passed: true,
            },
            {
              title: '文件执行位探测',
              description: '文件所有者、组、其他人权限中无任何 x 位 (当前所有位均为 -)',
              passed: false,
              terminalMessage: 'bash: ./target: Permission denied (no execute bit set on file)',
            },
          ],
        };
      }
    }
    return {
      allowed: true,
      exitCode: 0,
      reason: 'Root 超级用户拥有系统最高特权，无条件通过所有 DAC 权限检验。',
      kernelRule: 'UID == 0 (root) 旁路 DAC (Discretionary Access Control) 权限拦截',
      steps: [
        {
          title: '身份识别',
          description: '当前操作用户为 root (UID 0)',
          passed: true,
        },
        {
          title: '权限判定',
          description: '超级特权旁路，操作直接允许执行',
          passed: true,
          terminalMessage: '操作执行成功 (Return code: 0)',
        },
      ],
    };
  }

  // 2. Parent directory traversal check (Directory Search/Enter Permission 'x')
  // To access any file or directory inside parentDir, the actor must have 'x' on parentDir!
  const isParentOwner = currentUser === parentDir.owner;
  const isParentGroup = currentUserGroups.includes(parentDir.group);
  const parentDirPerm = isParentOwner
    ? parentDir.user
    : isParentGroup
    ? parentDir.groupPerm
    : parentDir.others;

  steps.push({
    title: '步骤 1: 父目录路径穿透检查 (Traverse / Search)',
    description: `访问目标路径需父目录具备 x (执行) 权限。判定身份: ${
      isParentOwner ? `所有者 (${parentDir.owner})` : isParentGroup ? `所属组成员 (${parentDir.group})` : '其他用户 (others)'
    }，父目录对应权限: r=${parentDirPerm.read ? '是' : '否'}, w=${parentDirPerm.write ? '是' : '否'}, x=${parentDirPerm.execute ? '是' : '否'}`,
    passed: parentDirPerm.execute,
    terminalMessage: parentDirPerm.execute ? undefined : 'cd: Permission denied (父目录缺少 +x 无法进入)',
  });

  if (!parentDirPerm.execute) {
    return {
      allowed: false,
      exitCode: 13,
      reason: '拒绝访问：父目录没有执行权限 (x)。Linux 中如果一个目录没有 x 权限，用户无法进入 (cd)，也无法访问其中的任何文件！',
      kernelRule: '目录的 x (执行) 权限是进入目录与解析路径的前提 (Directory Search/Traverse bit)',
      steps,
    };
  }

  // 3. Handle Directory operations: dir_enter, dir_list, dir_create, dir_delete
  if (action === 'dir_enter') {
    return {
      allowed: true,
      exitCode: 0,
      reason: '允许进入：用户在目标目录上拥有有效的执行 (x) 权限，可以切换工作目录。',
      kernelRule: '目录的 x 位允许进程调用 chdir() 系统调用',
      steps: [
        ...steps,
        {
          title: '步骤 2: 切换工作目录 (cd)',
          description: '目标目录具备 x 权限，成功进入',
          passed: true,
          terminalMessage: '成功进入目录 (pwd)',
        },
      ],
    };
  }

  if (action === 'dir_list') {
    const canList = parentDirPerm.read;
    steps.push({
      title: '步骤 2: 读取目录内容 (ls)',
      description: `读取目录内文件名列表需要目录具有 r (读) 权限。当前用户对应权限 r=${canList ? '开' : '关'}`,
      passed: canList,
      terminalMessage: canList ? undefined : 'ls: cannot open directory: Permission denied',
    });
    return {
      allowed: canList,
      exitCode: canList ? 0 : 13,
      reason: canList
        ? '允许列出：用户在目录上拥有 r (读) 权限，可读取目录内包含的文件名列表。'
        : '拒绝访问：目录没有 r (读) 权限，无法读取目录内文件名列表。',
      kernelRule: '目录的 r 权限允许调用 readdir() 获取目录中的 inode 目录项清单',
      steps,
    };
  }

  if (action === 'dir_create') {
    // Creating a file in directory requires directory write (w) AND directory execute (x)
    const canCreate = parentDirPerm.write && parentDirPerm.execute;
    steps.push({
      title: '步骤 2: 在目录中创建新文件 (touch/mkdir)',
      description: `在目录中新建文件修改的是父目录的 inode 数据块，因此必须要求父目录具备 w (写) 权限。当前父目录对应写权限 w=${parentDirPerm.write ? '开' : '关'}`,
      passed: canCreate,
      terminalMessage: canCreate ? undefined : 'touch: cannot touch "newfile": Permission denied',
    });
    return {
      allowed: canCreate,
      exitCode: canCreate ? 0 : 13,
      reason: canCreate
        ? '允许创建：用户对父目录拥有写 (w) 和执行 (x) 权限，可以在父目录写入新文件记录。'
        : '拒绝创建：父目录没有写 (w) 权限。新建文件是修改父目录的内容，必须在父目录拥有 w 权限！',
      kernelRule: '文件创建修改的是父目录的数据内容，权限受控于父目录的 write 位',
      steps,
    };
  }

  if (action === 'dir_delete') {
    // CRITICAL LINUX CONCEPT: Deletion permission is controlled by PARENT DIRECTORY WRITE PERMISSION, NOT FILE PERMISSIONS!
    // PLUS STICKY BIT RULE!
    if (!parentDirPerm.write) {
      steps.push({
        title: '步骤 2: 检查父目录写权限 (Directory Write)',
        description: '删除文件本质是从父目录的 inode 映射表中剔除条目，因此必须具备父目录的 w (写) 权限。当前无父目录写权限！',
        passed: false,
        terminalMessage: 'rm: cannot remove target: Permission denied (父目录无写权限)',
      });
      return {
        allowed: false,
        exitCode: 13,
        reason: '拒绝删除：用户在父目录中没有写 (w) 权限。注意：能否删除一个文件完全由父目录的权限决定，与文件自身的权限无关！',
        kernelRule: '删除文件属于修改父目录内容 (unlink)，由父目录的 w 权限控制',
        steps,
      };
    }

    steps.push({
      title: '步骤 2: 检查父目录写权限 (Directory Write)',
      description: '用户在父目录拥有 w (写) 权限，满足基础删除前提。',
      passed: true,
    });

    // Check Sticky Bit
    if (parentDir.sticky) {
      const isFileOwner = targetFile ? currentUser === targetFile.owner : false;
      const isDirOwner = currentUser === parentDir.owner;

      const stickyPassed = isFileOwner || isDirOwner;
      steps.push({
        title: '步骤 3: 粘滞位安全防线 (Sticky Bit 校验)',
        description: `父目录设置了 Sticky Bit (+t)！规则：只有文件所有者 (${targetFile?.owner || '未知'})、目录所有者 (${parentDir.owner}) 或 root 才能删除该文件。当前用户 (${currentUser}) 是文件所有者: ${isFileOwner ? '是' : '否'}，是目录所有者: ${isDirOwner ? '是' : '否'}`,
        passed: stickyPassed,
        terminalMessage: stickyPassed ? undefined : 'rm: cannot remove: Operation not permitted (Sticky bit protected!)',
      });

      if (!stickyPassed) {
        return {
          allowed: false,
          exitCode: 1,
          reason: '拒绝删除 (Operation not permitted)：虽然父目录有写权限，但启用了粘滞位 (Sticky Bit, 如 /tmp 目录)！在粘滞位目录下，只有文件所有者或目录所有者才能删除该文件，防止恶意删除他人文件。',
          kernelRule: 'Sticky Bit (S_ISVTX, 1000): 阻止非属主用户在公共可写目录中删除他人文件',
          steps,
        };
      }
    }

    return {
      allowed: true,
      exitCode: 0,
      reason: '允许删除：用户拥有父目录的写权限，且满足粘滞位检验条件，文件成功删除。',
      kernelRule: '父目录 w 权限通过 + 粘滞位检验通过',
      steps,
    };
  }

  // 4. Handle target file operations: file_read, file_write, file_execute
  if (!targetFile) {
    return {
      allowed: false,
      exitCode: 2,
      reason: '未指定目标文件',
      kernelRule: 'ENOENT',
      steps,
    };
  }

  // Linux Kernel DAC Identity Resolution Order:
  // 1. Is actor Owner? -> Evaluate Owner bits ONLY. (If owner lacks permission, Linux DOES NOT check group or others!)
  // 2. Is actor in Group? -> Evaluate Group bits ONLY. (Does NOT check others!)
  // 3. Otherwise -> Evaluate Others bits.
  const isOwner = currentUser === targetFile.owner;
  const isGroup = currentUserGroups.includes(targetFile.group);

  let evaluatedPerm: PermissionTriple;
  let identityType: string;

  if (isOwner) {
    identityType = `文件所有者 (User / Owner: ${targetFile.owner})`;
    evaluatedPerm = targetFile.user;
  } else if (isGroup) {
    identityType = `所属组成员 (Group: ${targetFile.group})`;
    evaluatedPerm = targetFile.groupPerm;
  } else {
    identityType = '其他用户 (Others)';
    evaluatedPerm = targetFile.others;
  }

  let requiredPermission = '';
  let hasPermission = false;
  let operationName = '';

  if (action === 'file_read') {
    requiredPermission = '读 (r)';
    hasPermission = evaluatedPerm.read;
    operationName = '读取文件内容 (cat/head/grep)';
  } else if (action === 'file_write') {
    requiredPermission = '写 (w)';
    hasPermission = evaluatedPerm.write;
    operationName = '修改或追加文件内容 (vim/echo >>)';
  } else if (action === 'file_execute') {
    requiredPermission = '执行 (x)';
    hasPermission = evaluatedPerm.execute;
    operationName = '执行可执行程序或脚本 (./script.sh)';
  }

  steps.push({
    title: '步骤 2: 确定主体身份层级 (POSIX DAC 排他性检验)',
    description: `内核依照优先级判定主体：${identityType}。注意：一旦匹配到了 Owner 或 Group，内核将立即锁定该层权限，绝不会向下溢出到其他人权限！`,
    passed: true,
  });

  steps.push({
    title: `步骤 3: 权限位检验 (${operationName})`,
    description: `在 [${identityType}] 权限槽中检验 ${requiredPermission}。当前对应位状态: ${hasPermission ? '具备 (允许)' : '缺失 (拒绝)'}`,
    passed: hasPermission,
    terminalMessage: hasPermission ? undefined : `bash: targetfile: Permission denied (${requiredPermission} 缺失)`,
  });

  if (hasPermission) {
    let extraSpecialNote = '';
    if (action === 'file_execute' && targetFile.special.suid) {
      extraSpecialNote = ` (注意：检测到 SUID 特殊位，进程将以文件属主 ${targetFile.owner} 的有效特权运行！)`;
    } else if (action === 'file_execute' && targetFile.special.sgid) {
      extraSpecialNote = ` (注意：检测到 SGID 特殊位，进程将以属组 ${targetFile.group} 的有效组特权运行！)`;
    }

    return {
      allowed: true,
      exitCode: 0,
      reason: `操作允许：用户以【${identityType}】身份成功通过了文件的 ${requiredPermission} 权限检验${extraSpecialNote}。`,
      kernelRule: `DAC 权限检验成功 (${identityType} 具备 ${requiredPermission} 位)`,
      steps,
    };
  } else {
    return {
      allowed: false,
      exitCode: 13,
      reason: `拒绝访问：用户匹配为【${identityType}】，但该身份权限位中缺少【${requiredPermission}】！`,
      kernelRule: `DAC 权限拒绝：匹配到 ${identityType}，无 ${requiredPermission} 权限`,
      steps,
    };
  }
}
