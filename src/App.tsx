import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Cloud, Server, Database, HardDrive, Folder, File, Settings, Shield, Network, GitBranch, Key } from 'lucide-react';

interface Command {
  input: string;
  output: string;
  timestamp: string;
}

interface Instance {
  id: string;
  name: string;
  status: 'running' | 'stopped';
  type: 'compute' | 'database' | 'storage' | 'network' | 'security';
}

interface GitRepo {
  name: string;
  url: string;
  status: 'cloned' | 'cloning' | 'error';
}

interface SSHKey {
  name: string;
  publicKey: string;
  fingerprint: string;
  created: string;
}

function App() {
  const [commands, setCommands] = useState<Command[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentPath, setCurrentPath] = useState('~');
  const [instances, setInstances] = useState<Instance[]>([]);
  const [gitRepos, setGitRepos] = useState<GitRepo[]>([]);
  const [sshKeys, setSSHKeys] = useState<SSHKey[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);

  const getTimestamp = () => {
    return new Date().toLocaleTimeString();
  };

  const generateInstanceId = () => {
    return Math.random().toString(36).substring(2, 15);
  };

  const generateSSHKey = (name: string) => {
    const randomKey = Math.random().toString(36).substring(2);
    const publicKey = `ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC${randomKey} ${name}@cloud-terminal`;
    const fingerprint = Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join(':');
    
    return {
      name,
      publicKey,
      fingerprint,
      created: new Date().toISOString()
    };
  };

  const handleCommand = (input: string) => {
    let output = '';
    const commandParts = input.trim().split(' ');
    const command = commandParts[0];

    switch (command) {
      case 'help':
        output = `Available commands:

System Commands:
  - clear: Clear the terminal screen
  - pwd: Print working directory
  - cd [path]: Change directory
  - ls: List directory contents
  - date: Show current date
  - time: Show current time
  - echo [text]: Display text
  - whoami: Display current user
  - uname: Display system information
  - history: Show command history
  - mkdir [name]: Create directory
  - touch [name]: Create file
  - rm [name]: Remove file/directory

SSH Commands:
  - ssh-keygen -t rsa -b 4096 -C [comment]: Generate new SSH key
  - ssh-add [keyname]: Add SSH key to agent
  - ssh-list: List all SSH keys
  - ssh [user@host]: Connect to remote host
  - ssh-copy-id [user@host]: Copy SSH key to server
  - ssh-remove [keyname]: Remove SSH key

Git Commands:
  - git clone [url]: Clone a repository
  - git status: Show repository status
  - git list: List cloned repositories
  - git config --global user.name [name]: Set Git username
  - git config --global user.email [email]: Set Git email

Network Commands:
  - ping [host]: Test network connectivity
  - ifconfig: Display network interfaces
  - netstat: Network statistics
  - curl [url]: Transfer data from URL
  - wget [url]: Download files

Cloud Commands:
  - gcloud: Show cloud management commands
  - instances list: List all instances
  - create instance [name] [type]: Create new instance
    Types: compute, database, storage, network, security
  - start instance [name]: Start an instance
  - stop instance [name]: Stop an instance
  - delete instance [name]: Delete an instance
  - describe instance [name]: Show instance details
  - logs [name]: Show instance logs
  - metrics [name]: Show instance metrics`;
        break;

      case 'ssh-keygen':
        if (commandParts[1] === '-t' && commandParts[2] === 'rsa' && commandParts[3] === '-b' && commandParts[4] === '4096' && commandParts[5] === '-C') {
          const comment = commandParts[6] || 'user@cloud-terminal';
          const newKey = generateSSHKey(comment);
          setSSHKeys(prev => [...prev, newKey]);
          output = `Generating public/private rsa key pair.
Your identification has been saved in /home/${comment}/.ssh/id_rsa
Your public key has been saved in /home/${comment}/.ssh/id_rsa.pub
The key fingerprint is:
SHA256:${newKey.fingerprint} ${comment}
The key's randomart image is:
+---[RSA 4096]----+
|     .o+.        |
|    . = o        |
|   . = +         |
|    + = .        |
|   .S + o        |
|    .+ =         |
|   .o + .        |
|  .o + .         |
| .o.o .          |
+----[SHA256]-----+`;
        } else {
          output = 'Usage: ssh-keygen -t rsa -b 4096 -C "your_email@example.com"';
        }
        break;

      case 'ssh-list':
        if (sshKeys.length === 0) {
          output = 'No SSH keys found.';
        } else {
          output = 'SSH Keys:\n\n' + sshKeys.map(key => 
            `${key.name}:\n  Fingerprint: ${key.fingerprint}\n  Created: ${key.created}\n  Public Key: ${key.publicKey.substring(0, 50)}...`
          ).join('\n\n');
        }
        break;

      case 'ssh-add':
        if (commandParts[1]) {
          const keyName = commandParts[1];
          const key = sshKeys.find(k => k.name === keyName);
          if (key) {
            output = `Identity added: ${keyName} (${key.fingerprint})`;
          } else {
            output = `Could not find SSH key: ${keyName}`;
          }
        } else {
          output = 'Usage: ssh-add [keyname]';
        }
        break;

      case 'ssh':
        if (commandParts[1] && commandParts[1].includes('@')) {
          const [user, host] = commandParts[1].split('@');
          output = `Connecting to ${host} as ${user}...
Permission denied (publickey).
Are you sure you have added your SSH key? Use ssh-keygen to generate a key and ssh-add to add it.`;
        } else {
          output = 'Usage: ssh user@host';
        }
        break;

      case 'ssh-copy-id':
        if (commandParts[1] && commandParts[1].includes('@')) {
          const [user, host] = commandParts[1].split('@');
          output = `Attempting to copy SSH key to ${host} for user ${user}...
/usr/bin/ssh-copy-id: INFO: Source of key(s) to be installed: "/home/user/.ssh/id_rsa.pub"
/usr/bin/ssh-copy-id: INFO: attempting to log in with the new key(s), to filter out any that are already installed
/usr/bin/ssh-copy-id: ERROR: ssh: connect to host ${host} port 22: Connection refused`;
        } else {
          output = 'Usage: ssh-copy-id user@host';
        }
        break;

      case 'ssh-remove':
        if (commandParts[1]) {
          const keyName = commandParts[1];
          const keyExists = sshKeys.some(k => k.name === keyName);
          if (keyExists) {
            setSSHKeys(prev => prev.filter(k => k.name !== keyName));
            output = `Removed SSH key: ${keyName}`;
          } else {
            output = `Could not find SSH key: ${keyName}`;
          }
        } else {
          output = 'Usage: ssh-remove [keyname]';
        }
        break;

      case 'git':
        if (commandParts[1] === 'clone' && commandParts[2]) {
          const url = commandParts[2];
          const name = url.split('/').pop()?.replace('.git', '') || 'repo';
          
          if (gitRepos.some(repo => repo.name === name)) {
            output = `Repository "${name}" already exists.`;
            break;
          }

          const newRepo: GitRepo = {
            name,
            url,
            status: 'cloned'
          };

          setGitRepos(prev => [...prev, newRepo]);
          output = `Cloning into '${name}'...
remote: Enumerating objects: 100, done.
remote: Counting objects: 100% (100/100), done.
remote: Compressing objects: 100% (80/80), done.
remote: Total 100 (delta 20), reused 90 (delta 10)
Receiving objects: 100% (100/100), 10.5 KiB | 5.25 MiB/s, done.
Resolving deltas: 100% (20/20), done.`;
        } else if (commandParts[1] === 'status') {
          if (gitRepos.length === 0) {
            output = 'Not a git repository';
          } else {
            output = `On branch main
Your branch is up to date with 'origin/main'.

nothing to commit, working tree clean`;
          }
        } else if (commandParts[1] === 'list') {
          if (gitRepos.length === 0) {
            output = 'No repositories found.';
          } else {
            output = 'Cloned Repositories:\n\n' + gitRepos.map(repo => 
              `${repo.name} (${repo.status})\n  ${repo.url}`
            ).join('\n\n');
          }
        } else if (commandParts[1] === 'config') {
          if (commandParts[2] === '--global' && commandParts[3] === 'user.name' && commandParts[4]) {
            output = `Git username set to: ${commandParts[4]}`;
          } else if (commandParts[2] === '--global' && commandParts[3] === 'user.email' && commandParts[4]) {
            output = `Git email set to: ${commandParts[4]}`;
          } else {
            output = 'Usage:\n  git config --global user.name [name]\n  git config --global user.email [email]';
          }
        } else {
          output = `Available git commands:
  - git clone [url]: Clone a repository
  - git status: Show repository status
  - git list: List cloned repositories
  - git config --global user.name [name]: Set Git username
  - git config --global user.email [email]: Set Git email`;
        }
        break;

      case 'gcloud':
        output = `Google Cloud CLI Simulator

Usage:
  - instances list: List all instances
  - create instance [name] [type]: Create new instance
  - start instance [name]: Start an instance
  - stop instance [name]: Stop an instance
  - delete instance [name]: Delete an instance
  - describe instance [name]: Show instance details
  - logs [name]: Show instance logs
  - metrics [name]: Show instance metrics

Available instance types:
  - compute: Virtual machine instances
  - database: Database instances
  - storage: Storage buckets
  - network: Network resources
  - security: Security services`;
        break;

      case 'ls':
        const repoFiles = gitRepos.map(repo => repo.name).join('\n');
        const sshDir = sshKeys.length > 0 ? '.ssh/' : '';
        output = `Documents/
Downloads/
Pictures/
${sshDir}
${repoFiles ? `\n${repoFiles}` : ''}
config.yaml
main.tf
README.md`;
        break;

      case 'whoami':
        output = 'admin@cloud-terminal';
        break;

      case 'uname':
        output = 'Cloud-Terminal-OS v1.0.0';
        break;

      case 'history':
        output = commands.map(cmd => cmd.input).join('\n');
        break;

      case 'ping':
        if (commandParts[1]) {
          output = `PING ${commandParts[1]} (192.168.1.1): 56 data bytes
64 bytes from 192.168.1.1: icmp_seq=0 ttl=64 time=0.080 ms
64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=0.075 ms
64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=0.079 ms`;
        } else {
          output = 'Usage: ping [host]';
        }
        break;

      case 'ifconfig':
        output = `eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet 192.168.1.100  netmask 255.255.255.0  broadcast 192.168.1.255
        inet6 fe80::1  prefixlen 64  scopeid 0x20<link>
        ether 00:00:00:00:00:00  txqueuelen 1000  (Ethernet)`;
        break;

      case 'netstat':
        output = `Active Internet connections (w/o servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State
tcp        0      0 localhost:5432          localhost:52738         ESTABLISHED
tcp        0      0 localhost:52738         localhost:5432          ESTABLISHED`;
        break;

      case 'instances':
        if (commandParts[1] === 'list') {
          if (instances.length === 0) {
            output = 'No instances found.';
          } else {
            output = 'NAME\t\tTYPE\t\tSTATUS\n';
            output += instances.map(instance => 
              `${instance.name}\t\t${instance.type}\t\t${instance.status}`
            ).join('\n');
          }
        }
        break;

      case 'create':
        if (commandParts[1] === 'instance' && commandParts[2] && commandParts[3]) {
          const name = commandParts[2];
          const type = commandParts[3] as Instance['type'];
          
          if (!['compute', 'database', 'storage', 'network', 'security'].includes(type)) {
            output = 'Invalid instance type. Use: compute, database, storage, network, or security';
            break;
          }

          if (instances.some(i => i.name === name)) {
            output = `Instance "${name}" already exists.`;
            break;
          }

          const newInstance: Instance = {
            id: generateInstanceId(),
            name,
            type,
            status: 'stopped'
          };

          setInstances(prev => [...prev, newInstance]);
          output = `Creating ${type} instance "${name}"...\nInstance created successfully.`;
        }
        break;

      case 'describe':
        if (commandParts[1] === 'instance' && commandParts[2]) {
          const name = commandParts[2];
          const instance = instances.find(i => i.name === name);
          
          if (!instance) {
            output = `Instance "${name}" not found.`;
            break;
          }

          output = `Instance Details:
Name: ${instance.name}
ID: ${instance.id}
Type: ${instance.type}
Status: ${instance.status}
Created: ${new Date().toISOString()}
Network: 10.0.0.${Math.floor(Math.random() * 255)}
CPU Usage: ${Math.floor(Math.random() * 100)}%
Memory: ${Math.floor(Math.random() * 8192)}MB
Disk: ${Math.floor(Math.random() * 100)}GB`;
        }
        break;

      case 'logs':
        if (commandParts[1]) {
          const name = commandParts[1];
          const instance = instances.find(i => i.name === name);
          
          if (!instance) {
            output = `Instance "${name}" not found.`;
            break;
          }

          output = `Logs for instance "${name}":
[${new Date().toISOString()}] System initialized
[${new Date().toISOString()}] Service started
[${new Date().toISOString()}] Connected to network
[${new Date().toISOString()}] Health check passed
[${new Date().toISOString()}] Resources allocated`;
        }
        break;

      case 'metrics':
        if (commandParts[1]) {
          const name = commandParts[1];
          const instance = instances.find(i => i.name === name);
          
          if (!instance) {
            output = `Instance "${name}" not found.`;
            break;
          }

          output = `Metrics for instance "${name}":
CPU Usage: ${Math.floor(Math.random() * 100)}%
Memory Usage: ${Math.floor(Math.random() * 100)}%
Disk Usage: ${Math.floor(Math.random() * 100)}%
Network In: ${Math.floor(Math.random() * 1000)}MB/s
Network Out: ${Math.floor(Math.random() * 1000)}MB/s
Response Time: ${Math.floor(Math.random() * 100)}ms`;
        }
        break;

      case 'start':
        if (commandParts[1] === 'instance' && commandParts[2]) {
          const name = commandParts[2];
          const instance = instances.find(i => i.name === name);
          
          if (!instance) {
            output = `Instance "${name}" not found.`;
            break;
          }

          if (instance.status === 'running') {
            output = `Instance "${name}" is already running.`;
            break;
          }

          setInstances(prev => prev.map(i => 
            i.name === name ? { ...i, status: 'running' } : i
          ));
          output = `Starting instance "${name}"...\nInstance is now running.`;
        }
        break;

      case 'stop':
        if (commandParts[1] === 'instance' && commandParts[2]) {
          const name = commandParts[2];
          const instance = instances.find(i => i.name === name);
          
          if (!instance) {
            output = `Instance "${name}" not found.`;
            break;
          }

          if (instance.status === 'stopped') {
            output = `Instance "${name}" is already stopped.`;
            break;
          }

          setInstances(prev => prev.map(i => 
            i.name === name ? { ...i, status: 'stopped' } : i
          ));
          output = `Stopping instance "${name}"...\nInstance is now stopped.`;
        }
        break;

      case 'delete':
        if (commandParts[1] === 'instance' && commandParts[2]) {
          const name = commandParts[2];
          const instance = instances.find(i => i.name === name);
          
          if (!instance) {
            output = `Instance "${name}" not found.`;
            break;
          }

          setInstances(prev => prev.filter(i => i.name !== name));
          output = `Deleting instance "${name}"...\nInstance deleted successfully.`;
        }
        break;

      case 'clear':
        setCommands([]);
        return;

      case 'pwd':
        output = currentPath;
        break;

      case 'date':
        output = new Date().toLocaleDateString();
        break;

      case 'time':
        output = new Date().toLocaleTimeString();
        break;

      case 'echo':
        output = commandParts.slice(1).join(' ');
        break;

      case 'cd':
        if (commandParts[1]) {
          setCurrentPath(commandParts[1]);
          output = '';
        } else {
          output = 'Please specify a path';
        }
        break;

      default:
        output = `Command '${command}' not found. Type 'help' to see available commands.`;
    }

    const newCommand: Command = {
      input,
      output,
      timestamp: getTimestamp(),
    };

    setCommands(prev => [...prev, newCommand]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentInput.trim()) {
      handleCommand(currentInput);
      setCurrentInput('');
    }
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [commands]);

  return (
    <div className="min-h-screen bg-gray-900 text-green-400 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-black rounded-lg shadow-xl overflow-hidden">
          {/* Title Bar */}
          <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex items-center text-gray-400">
              <Cloud className="w-5 h-5 mr-2" />
              <span>Cloud Terminal Simulator</span>
            </div>
          </div>

          {/* Instance Status Bar */}
          <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <Server className="w-4 h-4 mr-2" />
                <span className="text-sm">Compute: {instances.filter(i => i.type === 'compute').length}</span>
              </div>
              <div className="flex items-center">
                <Database className="w-4 h-4 mr-2" />
                <span className="text-sm">Database: {instances.filter(i => i.type === 'database').length}</span>
              </div>
              <div className="flex items-center">
                <HardDrive className="w-4 h-4 mr-2" />
                <span className="text-sm">Storage: {instances.filter(i => i.type === 'storage').length}</span>
              </div>
              <div className="flex items-center">
                <Network className="w-4 h-4 mr-2" />
                <span className="text-sm">Network: {instances.filter(i => i.type === 'network').length}</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-2" />
                <span className="text-sm">Security: {instances.filter(i => i.type === 'security').length}</span>
              </div>
              <div className="flex items-center">
                <GitBranch className="w-4 h-4 mr-2" />
                <span className="text-sm">Repos: {gitRepos.length}</span>
              </div>
              <div className="flex items-center">
                <Key className="w-4 h-4 mr-2" />
                <span className="text-sm">SSH Keys: {sshKeys.length}</span>
              </div>
            </div>
          </div>

          {/* Terminal Area */}
          <div
            ref={terminalRef}
            className="p-4 h-[500px] overflow-y-auto font-mono"
          >
            <div className="mb-4 text-gray-400">
              Welcome to Cloud Terminal Simulator v2.0
              Type 'help' to see available commands
            </div>
            
            {commands.map((cmd, index) => (
              <div key={index} className="mb-2">
                <div className="flex items-center text-gray-400">
                  <span className="text-blue-400">{currentPath}</span>
                  <span className="mx-2">$</span>
                  <span className="text-white">{cmd.input}</span>
                </div>
                {cmd.output && (
                  <div className="mt-1 whitespace-pre-wrap">{cmd.output}</div>
                )}
              </div>
            ))}

            {/* Current Input Line */}
            <form onSubmit={handleSubmit} className="flex items-center mt-2">
              <span className="text-blue-400">{currentPath}</span>
              <span className="mx-2 text-gray-400">$</span>
              <input
                type="text"
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                className="flex-1 bg-transparent outline-none text-white"
                autoFocus
              />
            </form>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="mt-6 bg-gray-800 rounded-lg p-4 text-gray-300">
          <h2 className="text-xl font-bold mb-3">Quick Reference</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h3 className="font-semibold mb-2">System Commands</h3>
              <ul className="space-y-1 text-sm">
                <li>• help - Show all commands</li>
                <li>• clear - Clear screen</li>
                <li>• pwd - Show current directory</li>
                <li>• ls - List files</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">SSH Commands</h3>
              <ul className="space-y-1 text-sm">
                <li>• ssh-keygen - Generate key</li>
                <li>• ssh-add - Add key</li>
                <li>• ssh-list - List keys</li>
                <li>• ssh user@host - Connect</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Cloud Management</h3>
              <ul className="space-y-1 text-sm">
                <li>• create instance [name] [type]</li>
                <li>• instances list</li>
                <li>• start/stop instance [name]</li>
                <li>• describe instance [name]</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Network Tools</h3>
              <ul className="space-y-1 text-sm">
                <li>• ping [host]</li>
                <li>• ifconfig</li>
                <li>• netstat</li>
                <li>• curl/wget [url]</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;