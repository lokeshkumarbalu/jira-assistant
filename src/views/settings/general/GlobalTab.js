import React from 'react';
import TabControlBase from './TabControlBase';
import { Checkbox, SelectBox } from '../../../controls';
import { inject } from '../../../services/injector-service';
import { executeService } from '../../../common/proxy';
import { InputMask } from 'primereact/inputmask';

const defaultMinTimeToTrack = '00:05';
const roundList = [
    { value: '5', label: '5 Minutes' },
    { value: '10', label: '10 Minutes' },
    { value: '15', label: '15 Minutes' },
    { value: '30', label: '30 Minutes' },
    { value: '60', label: '1 Hour' }
];
const roundOperation = [
    { value: '', label: 'No Rounding' },
    { value: 'round', label: 'Closest value' },
    { value: 'ceil', label: 'Upper bound' },
    { value: 'floor', label: 'Lower bound' }
];

class GlobalTab extends TabControlBase {
    constructor(props) {
        super(props);
        inject(this, 'SettingsService', 'AppBrowserService', 'MessageService');
        this.state = {};
        this.loadSettings();
    }

    async loadSettings() {
        const TR_PauseOnLock = await this.$settings.get('TR_PauseOnLock');
        const TR_PauseOnIdle = await this.$settings.get('TR_PauseOnIdle');
        const TR_MinTime = await this.$settings.get('TR_MinTime');
        const TR_RoundTime = await this.$settings.get('TR_RoundTime');
        const TR_RoundOpr = await this.$settings.get('TR_RoundOpr');
        this.setState({ TR_PauseOnLock, TR_PauseOnIdle, TR_MinTime, TR_RoundTime, TR_RoundOpr });
    }

    lockChanged = async (value, field) => {
        if (value) {
            const granted = await this.$jaBrowserExtn.requestPermission(['idle']);
            if (!granted) {
                this.$message.error('Permission denied for JA to track system state.', 'Permission denied');
                return;
            }
        }

        await this.saveSetting(value, field);

        try {
            await executeService('SELF', 'RELOAD', [], this.$message);
        } catch (err) {
            this.$message.error('This settings would work only with JA extension v2.41 or above.', 'Unsupported Settings');
            console.log(err);
        }
    };

    saveSetting = async (value, field) => {
        await this.$settings.set(field, value || null);
        this.setState({ [field]: value });
    };

    render() {
        const { state: { TR_PauseOnLock, TR_PauseOnIdle, TR_MinTime, TR_RoundTime, TR_RoundOpr } } = this;

        return (
            <div className="ui-g ui-fluid">
                <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                    <strong>Time tracker</strong>
                </div>
                <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                    <div className="form-group">
                        <Checkbox checked={TR_PauseOnLock} field="TR_PauseOnLock" onChange={this.lockChanged} label="Pause time tracker when system is locked" />
                        <span className="help-block">Timer will be paused when system is locked and it would be resumed when unlocked</span>
                    </div>
                    <div className="form-group">
                        <Checkbox checked={TR_PauseOnIdle} field="TR_PauseOnIdle" onChange={this.lockChanged} label="Pause time tracker when system is idle" />
                        <span className="help-block">Timer will be paused when system goes to idle state and resumed when active</span>
                    </div>
                    <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                        <strong>Minimum time spent</strong>
                    </div>
                    <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                        <div className="form-group">
                            <InputMask mask="99:99" value={TR_MinTime} onChange={(e) => this.saveSetting(e.value, 'TR_MinTime')}
                                placeholder={defaultMinTimeToTrack} maxLength={5} style={{ 'width': '150px', 'display': 'inline-block' }} />
                            <span className="help-block">Minimum time required to generate worklog. Tracker stopped with time lesser than this setting would be ignored</span>
                        </div>
                    </div>
                    <div className="form-label ui-g-12 ui-md-3 ui-lg-3 ui-xl-2">
                        <strong>Round tracked time</strong>
                    </div>
                    <div className="ui-g-12 ui-md-9 ui-lg-9 ui-xl-10">
                        <div className="form-group">
                            <SelectBox className="form-control select" dataset={roundOperation} value={TR_RoundOpr || ''}
                                field="TR_RoundOpr" onChange={this.saveSetting}
                                style={{ width: '150px', display: 'inline-block' }} />
                            <SelectBox className="form-control select" dataset={roundList} value={TR_RoundTime || '5'}
                                field="TR_RoundTime" onChange={this.saveSetting}
                                style={{ width: '150px', display: 'inline-block' }} />
                            <span className="help-block">Round the tracked time to x minute as selected</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default GlobalTab;