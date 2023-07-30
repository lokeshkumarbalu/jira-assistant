import React, { PureComponent } from 'react';
import { UncontrolledDropdown, DropdownItem, DropdownMenu, DropdownToggle } from 'reactstrap';
import { inject } from '../../services';
import Dialog from '../../dialogs';
import UpdatesInfo from './UpdatesInfo';
import TextParser from '../../components/TextParser';

class Notifications extends PureComponent {
    constructor(props) {
        super(props);
        inject(this, "NotificationService", "AnalyticsService", "UserUtilsService", "UtilsService");
        const { updates_info, list, total, unread } = props.notifications;
        this.state = { updates_info, list, total, unread };
    }

    readMessage = (msg) => {
        let message = msg.message;
        let styles = null;
        if (msg.type === "versionInfo") {
            styles = { width: '90vw', maxWidth: '1000px' };
            message = <UpdatesInfo updates={this.state.updates_info} />;
        } else {
            message = <TextParser message={message} />;
        }

        const onClosed = () => this.markRead(msg, true);
        Dialog.alert(message, msg.title, styles).then(onClosed, onClosed);
    };

    markRead = (msg, viewed) => {
        if (!msg.read) {
            msg.read = true;
            this.$noti.markRead(msg);
            const event = (viewed ? "Viewed" : "Mark as read");
            this.trackAnalytics(msg, event);
            this.setState((s) => ({ unread: (s.unread || 1) - 1 }));
        }
    };

    trackViewList = () => {
        const { total, unread } = this.state;
        this.$analytics.trackEvent("Messages: List viewed", "Messages", `Messages: Total: ${total}, Unread: ${unread}`);
    };

    trackAnalytics(msg, event) {
        this.$analytics.trackEvent((msg.type === "versionInfo" ? "Update Info: " : "Message: ") + event, "Messages", `Message Id: ${msg.id}`);
    }

    render() {
        const { list, total, unread } = this.state;

        if (!list || !list.length) {
            return null;
        }

        return (
            <UncontrolledDropdown nav direction="down">
                <DropdownToggle nav onClick={this.trackViewList}>
                    <i className="fa fa-bell"></i>{unread > 0 && <span className="badge badge-danger">{unread}</span>}
                </DropdownToggle>
                <DropdownMenu end className="messages">
                    <DropdownItem header tag="div">
                        <div className="text-center"><strong>You have {unread || total} {unread ? "unread" : ""} messages</strong></div>
                    </DropdownItem>
                    {list.map((msg, i) => (<Message key={i} message={msg} onOpen={this.readMessage} onRead={this.markRead} cut={this.$utils.cut} />))}
                </DropdownMenu>
            </UncontrolledDropdown>
        );
    }
}

export default Notifications;

function Message({ message, onOpen, onRead, cut }) {
    const readMessage = React.useCallback(() => onOpen(message), [message, onOpen]);
    const markRead = React.useCallback(() => onRead(message), [message, onRead]);

    return (
        <DropdownItem tag="div" title="Click to view this message">
            {!message.read && <small className="float-end mt-0" onClick={markRead} title="Click to mark this message as read">
                <span className="fa fa-eye mark-read" /></small>}
            <div className={`text-truncate${message.read ? "" : " font-weight-bold"}`} onClick={readMessage}>
                {message.important && <span className="fa fa-exclamation text-danger"></span>} {message.title}
            </div>
            <div className="small text-muted message" onClick={readMessage}><TextParser message={cut(message.message, 175, true)} /></div>
        </DropdownItem>
    );
}
