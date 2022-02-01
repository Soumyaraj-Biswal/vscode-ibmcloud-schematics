/**
 * IBM Cloud Schematics
 * (C) Copyright IBM Corp. 2021 All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

 import * as vscode from 'vscode';
 import * as shell from '../shell';
 import  * as terraform from '../shell/terraform/index';
 import * as util from '../../util';
 import { path } from '../../util/workspace';
 var os = require('os');
 
 import { Terminal } from '../../util/terminal';
 
 export default class EstimateCostTerminal implements vscode.Pseudoterminal {
     private writeEmitter = new vscode.EventEmitter<string>();
     onDidWrite: vscode.Event<string> = this.writeEmitter.event;
     private closeEmitter = new vscode.EventEmitter<number>();
     onDidClose?: vscode.Event<number> = this.closeEmitter.event;
 
     constructor() {}
 
     open(initialDimensions: vscode.TerminalDimensions | undefined): void {
         this.estimateCost();
     }
 
     close(): void {}
 
     private async  estimateCost(): Promise<any> {
        var self = this;
        var terminal = new Terminal(self.writeEmitter, self.closeEmitter);
        
        const API_KEY = 'IC_API_KEY=';
        try{
            await util.workspace.createCredentialFile();
            terminal.printHeading("Running terraform init");
            await terraform.init();
            terminal.printSuccess( "terraform init" );

            terminal.printHeading( "Running terraform plan" );
            await terraform.createPlan();
            terminal.printSuccess("terraform plan" );

            terminal.printHeading("Creating cost.json file");
            await terraform.createJSON();
            await util.workspace.readCredentials().then(async (rs: any)=>{
                const key = rs.apiKey;
                shell.exportAPIKey(API_KEY, key);
                await terraform.calculateTFCost();
                terminal.printSuccess("cost.json file created");
                terminal.fireClose(1);
            });
            
        }catch(error: any){
            terminal.printFailure( "Cost Estimation Error");
            var text = error;            
            if (typeof error !== 'string') {
                text = error.toString();
            }
            var lines: string[] = text.split(/\r?\n/);
            for (let i = 0; i < lines.length; i++) {
                terminal.printText(lines[i]);
            }
        }
        
        return util.workspace.readFile(path.join(util.workspace.getWorkspacePath(),"cost.json"));
    }
    
 }
 