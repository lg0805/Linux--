export type FileType = '-' | 'd' | 'l' | 's' | 'p' | 'c' | 'b';

export interface PermissionTriple {
  read: boolean;
  write: boolean;
  execute: boolean;
}

export interface SpecialPermissions {
  suid: boolean;     // 4000 (Set User ID)
  sgid: boolean;     // 2000 (Set Group ID)
  sticky: boolean;   // 1000 (Sticky Bit)
}

export interface FullPermissionState {
  fileType: FileType;
  user: PermissionTriple;
  group: PermissionTriple;
  others: PermissionTriple;
  special: SpecialPermissions;
  filename: string;
  owner: string;
  groupName: string;
  sizeBytes: number;
}

export interface PermissionEvaluationResult {
  allowed: boolean;
  exitCode: number;
  reason: string;
  steps: {
    title: string;
    description: string;
    passed: boolean;
    terminalMessage?: string;
  }[];
  kernelRule: string;
}

export type ActionType = 
  | 'dir_enter'      // cd <dir>
  | 'dir_list'       // ls <dir>
  | 'dir_create'     // touch <dir>/newfile
  | 'dir_delete'     // rm <dir>/targetfile
  | 'file_read'      // cat <file>
  | 'file_write'     // echo "text" >> <file>
  | 'file_execute';  // ./<file>

export interface ScenarioChallenge {
  id: string;
  title: string;
  category: 'web' | 'security' | 'collaboration' | 'troubleshoot' | 'special';
  badge: string;
  description: string;
  currentSetup: {
    path: string;
    type: 'file' | 'dir';
    currentPermOctal: string;
    owner: string;
    group: string;
    currentUser: string;
    currentUserGroups: string[];
    symptom: string;
  };
  goal: string;
  options: {
    command: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  detailedWalkthrough: string;
}
