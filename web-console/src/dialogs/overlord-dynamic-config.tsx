/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Intent } from "@blueprintjs/core";
import axios from "axios";
import * as React from "react";

import { AutoForm } from "../components/auto-form";
import { IconNames } from "../components/filler";
import { AppToaster } from "../singletons/toaster";
import { getDruidErrorMessage } from "../utils";

import { SnitchDialog } from "./snitch-dialog";

import "./overlord-dynamic-config.scss";

export interface OverlordDynamicConfigDialogProps extends React.Props<any> {
  onClose: () => void;
}

export interface OverlordDynamicConfigDialogState {
  dynamicConfig: Record<string, any> | null;
  allJSONValid: boolean;
}

export class OverlordDynamicConfigDialog extends React.Component<OverlordDynamicConfigDialogProps, OverlordDynamicConfigDialogState> {
  constructor(props: OverlordDynamicConfigDialogProps) {
    super(props);
    this.state = {
      dynamicConfig: null,
      allJSONValid: true
    };
  }

  componentDidMount(): void {
    this.getConfig();
  }

  async getConfig() {
    let config: Record<string, any> | null = null;
    try {
      const configResp = await axios.get("/druid/indexer/v1/worker");
      config = configResp.data || {};
    } catch (e) {
      AppToaster.show({
        iconName: IconNames.ERROR,
        intent: Intent.DANGER,
        message: `Could not load overlord dynamic config: ${getDruidErrorMessage(e)}`
      });
      return;
    }
    this.setState({
      dynamicConfig: config
    });
  }

  private saveConfig = async (author: string, comment: string) => {
    const { onClose } = this.props;
    const newState: any = this.state.dynamicConfig;
    try {
      await axios.post("/druid/indexer/v1/worker", newState, {
        headers: {
          "X-Druid-Author": author,
          "X-Druid-Comment": comment
        }
      });
    } catch (e) {
      AppToaster.show({
        iconName: IconNames.ERROR,
        intent: Intent.DANGER,
        message: `Could not save overlord dynamic config: ${getDruidErrorMessage(e)}`
      });
    }

    AppToaster.show({
      message: 'Saved overlord dynamic config',
      intent: Intent.SUCCESS
    });
    onClose();
  }

  render() {
    const { onClose } = this.props;
    const { dynamicConfig, allJSONValid } = this.state;

    return <SnitchDialog
      className="overlord-dynamic-config"
      isOpen
      onSave={this.saveConfig}
      onClose={onClose}
      title="Overlord dynamic config"
      saveDisabled={!allJSONValid}
    >
      <p>
        Edit the overlord dynamic configuration on the fly.
        For more information please refer to the <a href="http://druid.io/docs/latest/configuration/index.html#overlord-dynamic-configuration" target="_blank">documentation</a>.
      </p>
      <AutoForm
        fields={[
          {
            name: "selectStrategy",
            type: "json"
          },
          {
            name: "autoScaler",
            type: "json"
          }
        ]}
        model={dynamicConfig}
        onChange={m => this.setState({ dynamicConfig: m })}
        updateJSONValidity={e => this.setState({allJSONValid: e})}
      />
    </SnitchDialog>;
  }
}
