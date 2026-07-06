import type { Dispatch, SetStateAction } from 'react';
import type { Message } from '../domain/message';
import type { User } from '../../users/domain/user';
import { EmptyState } from '../../../shared/ui/EmptyState';

type MessageForm = { to: string; body: string };

type MessagesViewProps = {
  activeChatUser?: User;
  chatMessages: Message[];
  currentUser: User;
  messageForm: MessageForm;
  messages: Message[];
  openConversation: (id: string) => void;
  sendMessage: () => void;
  setMessageForm: Dispatch<SetStateAction<MessageForm>>;
  unreadMessages: number;
  users: User[];
};

export function MessagesView(props: MessagesViewProps) {
  const { activeChatUser, chatMessages, currentUser, messageForm, messages, openConversation, sendMessage, setMessageForm, unreadMessages, users } = props;
  const chatUsers = users
    .filter((user) => user.id !== currentUser.id)
    .map((user) => {
      const conversation = messages
        .filter((message) => (message.from === currentUser.id && message.to === user.id) || (message.from === user.id && message.to === currentUser.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const unread = conversation.filter((message) => message.from === user.id && message.to === currentUser.id && message.unread).length;
      return { user, lastMessage: conversation[0], unread };
    })
    .sort((a, b) => (b.lastMessage?.createdAt ?? '').localeCompare(a.lastMessage?.createdAt ?? ''));

  return (
    <section className="chat-page">
      <aside className="card chat-sidebar">
        <div className="panel-head">
          <div>
            <span className="section-kicker">Mensajes</span>
            <h3>Chats</h3>
          </div>
          <span>{unreadMessages} sin leer</span>
        </div>
        <div className="chat-users">
          {chatUsers.length === 0 ? (
            <EmptyState title="Sin compañeros disponibles" description="Cuando haya más usuarios cargados, vas a poder iniciar conversaciones internas." variant="users" />
          ) : chatUsers.map(({ user, lastMessage, unread }) => {
            return (
              <button key={user.id} className={`${activeChatUser?.id === user.id ? 'chat-user active' : 'chat-user'}${unread > 0 ? ' unread' : ''}`} onClick={() => openConversation(user.id)}>
                <div className="avatar small">{user.name.slice(0, 1)}</div>
                <div>
                  <strong>{user.name}</strong>
                  <span>{lastMessage?.body ?? user.area}</span>
                </div>
                {unread > 0 && <em className="unread-badge" aria-label={`${unread} mensajes sin leer`}>{unread > 99 ? '99+' : unread}</em>}
              </button>
            );
          })}
        </div>
      </aside>

      <section className="card chat-window">
        {activeChatUser ? <div className="chat-header">
          <div className="avatar">{activeChatUser.name.slice(0, 1)}</div>
          <div><h3>{activeChatUser.name}</h3><span>{activeChatUser.role} · {activeChatUser.area}</span></div>
        </div> : null}
        <div className="chat-thread">
          {!activeChatUser ? (
            <EmptyState title="Sin conversaciones disponibles" description="Cuando haya otros usuarios cargados, vas a poder iniciar chats internos desde acá." variant="messages" />
          ) : chatMessages.length === 0 ? (
            <EmptyState title="Sin mensajes todavía" description="Escribí el primer mensaje para empezar esta conversación." variant="messages" />
          ) : chatMessages.map((message) => (
            <div key={message.id} className={message.from === currentUser.id ? 'chat-bubble mine' : 'chat-bubble'}>
              <p>{message.body}</p>
              <span>{formatMessageDate(message.createdAt)} · {message.time}</span>
            </div>
          ))}
        </div>
        {activeChatUser && <div className="chat-composer">
          <input
            placeholder={`Mensaje para ${activeChatUser.name}`}
            value={messageForm.body}
            onChange={(event) => setMessageForm({ ...messageForm, body: event.target.value })}
            onKeyDown={(event) => {
              if (event.key === 'Enter') sendMessage();
            }}
          />
          <button className="primary-btn" onClick={sendMessage}>Enviar</button>
        </div>}
      </section>
    </section>
  );
}

function formatMessageDate(value: string) {
  return new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short' }).format(new Date(value));
}
