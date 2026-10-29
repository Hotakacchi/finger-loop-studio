// Keep the canvas visible and move secondary controls into accessible dialogs.
const studio = document.querySelector('.studio');
const toolbar = document.createElement('div');
toolbar.className = 'compact-toolbar';
const makeDialog = (id, title, content) => {
  const dialog = document.createElement('dialog');
  dialog.id = id;
  dialog.className = 'app-dialog';
  const head = document.createElement('div');
  head.className = 'dialog-head';
  const heading = document.createElement('h2');
  heading.textContent = title;
  const close = document.createElement('button');
  close.className = 'btn';
  close.textContent = '閉じる';
  close.addEventListener('click', () => dialog.close());
  head.append(heading, close);
  dialog.append(head, content);
  document.body.append(dialog);
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  return dialog;
};
const cards = document.querySelectorAll('.side .side-card');
const settingsDialog = makeDialog('settingsDialog', '音の設定', cards[1]);
const helpDialog = makeDialog('helpDialog', '使い方', cards[0]);
const toolsDialog = makeDialog('toolsDialog', '作品の操作', document.querySelector('.extra-controls'));
for (const [label, dialog] of [['音の設定', settingsDialog], ['作品の操作', toolsDialog], ['使い方', helpDialog]]) {
  const button = document.createElement('button');
  button.className = 'btn';
  button.textContent = label;
  button.addEventListener('click', () => dialog.showModal());
  toolbar.append(button);
}
studio.append(toolbar);
document.querySelector('.side').remove();
