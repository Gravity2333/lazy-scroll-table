// message.ts
type MessageType = 'success' | 'info' | 'error';

interface MessageOptions {
  content: string;
  duration?: number;
}

const messageContainer = document.createElement('div');
messageContainer.style.position = 'fixed';
messageContainer.style.top = '20px';
messageContainer.style.left = '50%';
messageContainer.style.transform = 'translateX(-50%)';
messageContainer.style.zIndex = '9999';
messageContainer.style.pointerEvents = 'none';
messageContainer.style.display = 'flex';
messageContainer.style.flexDirection = 'column';
messageContainer.style.alignItems = 'center';
document.body.appendChild(messageContainer);

const createMessage = (type: MessageType, { content, duration = 3000 }: MessageOptions) => {
  const message = document.createElement('div');
  message.style.padding = '12px 20px';
  message.style.marginBottom = '10px';
  message.style.borderRadius = '8px';
  message.style.fontSize = '14px';
  message.style.color = 'white';
  message.style.display = 'flex';
  message.style.alignItems = 'center';
  message.style.opacity = '0';
  message.style.animation = 'fadeIn 0.3s forwards';

  switch (type) {
    case 'success':
      message.style.backgroundColor = '#52c41a';
      break;
    case 'info':
      message.style.backgroundColor = '#1890ff';
      break;
    case 'error':
      message.style.backgroundColor = '#f5222d';
      break;
    default:
      message.style.backgroundColor = '#1890ff';
      break;
  }

  message.textContent = content;

  messageContainer.appendChild(message);

  setTimeout(() => {
    message.style.opacity = '1';
  }, 0); // Trigger opacity change after appending to ensure animation starts

  setTimeout(() => {
    message.style.opacity = '0';
    setTimeout(() => {
      message.remove();
    }, 300); // After opacity change, remove the element after animation ends
  }, duration);
};

const message = {
  success: (options: MessageOptions) => {
    createMessage('success', options);
  },
  info: (options: MessageOptions) => {
    createMessage('info', options);
  },
  error: (options: MessageOptions) => {
    createMessage('error', options);
  },
};

export default message;
