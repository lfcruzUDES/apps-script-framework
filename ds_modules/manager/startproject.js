const { execSync } = require("child_process");
const fs = require('fs-extra');
const path = require('path');
const AbstractArgument = require('./prototype');

/**
 * Manages startproject argument.
  * */
class StartProjectProto extends AbstractArgument {
  name = 'startproject';

  help = 'creates a new GAS project.';

  projectData = {
    projectName: null,
    gasId: null,
    gasIdDev: null,
    ds_modules: [],
  };

  filesToCopyBase = [
    '.eslintrc.js',
    'tsconfig.json',
    '.claspignore',
    'Settings.ts',
    'init_node.bash',
  ];

  filesToCopyApp = [];

  commands = [
    'npm init -y',
    'npm install -g @google/clasp',
    'npm install -g typescript',
    'npm i -S @types/google-apps-script',
    'npm install eslint eslint-config-airbnb-typescript'
    + ' eslint-plugin-import@^2.22.0'
    + ' @typescript-eslint/eslint-plugin@^4.4.1 --save-dev',
  ];

  constructor(parser) {
    super(parser);
  }
  
  /**
    * Arguments
    * */
  argParser() {
    this.parser.add_argument(this.name, { help: this.help });
    this.parser.add_argument('-n', '--project-name', {
      action: 'store',
      help: 'set a project name.',
    });
    this.parser.add_argument('-p', '--project-path', {
      action: 'store',
      help: 'set a path and name project.',
    });
    this.parser.add_argument('-id', '--gas-id', {
      action: 'store',
      help: 'set GAS project id.',
    });
    this.parser.add_argument('-idd', '--gas-id-dev', {
      action: 'store',
      help: 'set GAS project id for dev.',
    });
    this.parser.add_argument('-am', '--add-module', {
      action: 'append',
      choices: this.dsModules,
      help: 'add module',
    });
    this.parser.add_argument('-fe', '--force-directory', {
      action: 'store_true',
      help: 'force project creation even directory exists.',
    });
    this.argsv = this.parser.parse_args();
  }

  /**
    * Executes al process to create a new project.
    * */
  async processor() {
    const configData = this.projectData;
    const projectName = await this.valArsOrPrompt(
      'project_name',
      'Enter a project name: ',
    );
    let projectPath = await this.valArsOrPrompt(
      'project_path',
      'Enter directory path: ',
    );
    projectPath = projectPath.split('/').length === 1
      ? path.join(process.cwd(), projectPath)
      : projectPath;
    let dsModules = await this.valArsOrPrompt(
      'add_module',
      `Enter modules splited by comma (,).\nDS modules allowed: ${this.dsModules.join(', ')}.\nModules: `,
    );
    dsModules = typeof dsModules === 'string'
      ? dsModules.split(',')
      : dsModules;
    const gasId = await this.valArsOrPrompt('gas_id');
    const gasIdDev = await this.valArsOrPrompt('gas_id_dev');
    // Configuration file in the new project.
    const configFile = path.join(projectPath, this.configFile);
    // ds_modules in the new project.
    const dsModulesNewProject = path.join(projectPath, this.dsModulesName);
    // ds_modules in Dragon Script App.
    const dirModules = path.join(this.baseDir, this.dsModulesName);
    // Directory for user code.
    const appDir = path.join(projectPath, projectName.replace(' ', '_'));
    // Clasp file.
    const claspFile = path.join(this.baseDir, '.clasp.json');
    if (projectName && projectPath) {
      if (!fs.existsSync(projectPath)
        || this.argsv.force_directory) {
        configData.projectName = projectName;
        configData.projectPath = projectPath;
        configData.gasId = gasId;
        configData.gasIdDev = gasIdDev;
        configData.ds_modules = dsModules;
        if (!fs.existsSync(projectPath)) fs.mkdirSync(projectPath);
        if (!fs.existsSync(appDir)) fs.mkdirSync(appDir);
        fs.writeFileSync(configFile, JSON.stringify(configData, null, 4));
        if (dsModules && dsModules.length > 0) {
          if (!fs.existsSync(dsModulesNewProject)) fs.mkdirSync(dsModulesNewProject);
          fs.copySync(
            path.join(dirModules, 'interfaces.ts'),
            path.join(dsModulesNewProject, 'interfaces.ts'),
          );
          dsModules.forEach((moduleName) => {
            const moduleNameCleaned = moduleName.trim();
            const module = path.join(dirModules, moduleNameCleaned);
            if (moduleName && fs.existsSync(module)) {
              fs.copySync(
                module,
                path.join(dsModulesNewProject, moduleNameCleaned),
              );
            }
          });
        }
        this.filesToCopyBase.forEach((f) => fs.copySync(
          path.join(this.baseDir, f),
          path.join(projectPath, f),
        ));
        // fs.copySync(
        //   path.join(this.baseDir, 'app'),
        //   appDir,
        // );
        process.chdir(projectPath);
        // this.commands.forEach((c) => execSync(c));
        const claspNewProject = path.join(projectPath, '.clasp.json');
        fs.copySync(
          claspFile,
          claspNewProject,
        );
        if (gasId || gasIdDev) {
          const claspData = JSON.parse(fs.readFileSync(claspFile).toString());
          claspData.scriptId = gasId || gasIdDev;
          fs.writeFileSync(claspNewProject, JSON.stringify(claspData));
          // execSync('clasp pull');
        }
        const jsFiles = fs.readdirSync(projectPath)
          .filter((i) => i.substr(-3) === '.js');
        jsFiles.forEach((f) => {
          if (this.filesToCopyBase.indexOf(f) < 0) {
            fs.renameSync(
              path.join(projectPath, f),
              path.join(appDir, f),
            );
          }
        });
      } else {
        console.log('Project directory alreday exists.');
      }
    }
  }
}

/**
 * Client to StartProjectProto.
  * */
const StartProject = (parser) => new StartProjectProto(parser);

module.exports = StartProject;
