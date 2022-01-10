import Backbone from 'backbone';
const $ = Backbone.$;

export default {
  run(editor, sender, opts = {}) {
    sender && sender.set && sender.set('active', 0);
    const config = editor.getConfig();
    const modal = editor.Modal;
    const pfx = config.stylePrefix;
    this.cm = editor.CodeManager || null;

    if (!this.$editors) {
      const oHtmlEd = this.buildEditor('htmlmixed', 'hopscotch', 'HTML');
      const oCsslEd = this.buildEditor('css', 'hopscotch', 'CSS');
      this.htmlEditor = oHtmlEd.el;
      this.label = document.createElement('input');
      this.className = document.createElement('input');
      this.label.setAttribute('type', 'text');
      this.label.setAttribute('placeholder', 'Label');
      this.label.setAttribute('required', true);
      this.label.classList.add('input-element');
      this.className.setAttribute('type', 'text');
      this.className.setAttribute('placeholder', 'Class Name');
      this.className.classList.add('input-element');
      const div = document.createElement('div');
      div.classList.add('input-container');

      this.cssEditor = oCsslEd.el;
      // Init import button
      const btnImp = document.createElement('button');
      btnImp.type = 'button';
      btnImp.innerHTML = 'Save';
      btnImp.className = `${pfx}btn-prim ${pfx}btn-import`;
      btnImp.onclick = e => {
        if (!this.label.value) {
          alert('Label is mandatory');
          return;
        }
        let cssContent = this.cssEditor.getContent();
        cssContent = cssContent
          .replace(/(\r\n|\n|\r)/gm, ' ')
          .replaceAll("'", '"');
        editor.Blocks.add(
          this.label.value
            .split(/(?=[A-Z])/)
            .join('_')
            .toLowerCase(),
          {
            label: this.label.value,
            category: 'Custom',
            attributes: { class: this.className.value || '' },
            activate: true,
            content: {
              type: 'text',
              content: this.htmlEditor.getContent(),
              styles: this.cssEditor.getContent()
            }
          }
        );
        // editor.addComponents(`<style>${this.cssEditor.getContent()}</style>`)
        const allBlocks = JSON.stringify(
          editor.Blocks.getAll().filter(b => b.category === 'Custom')
        );
        console.log(JSON.parse(allBlocks));

        localStorage.setItem('gjs-blocks-list', allBlocks);
        modal.close();
      };
      const $editors = $(`<div class="${pfx}-add-component-dl"></div>`);
      div.appendChild(this.label);
      div.appendChild(this.className);
      $editors.append(div);
      $editors.append(oHtmlEd.$el).append(oCsslEd.$el);
      $editors.append(btnImp);
      this.$editors = $editors;
    }

    modal
      .open({
        title: config.modalImportButton,
        content: this.$editors
      })
      .getModel()
      .once('change:open', () => editor.stopCommand(this.id));

    this.htmlEditor.setContent(`
    <div class='test'>
      <div>
      test
      </div>
      <div>
      test
      </div>
    </div>
  `);
    this.cssEditor.setContent(`
    .test {
      padding-top: 10px;
      margin-bottom: 10px;
    }
    `);
  },

  stop(editor) {
    const modal = editor.Modal;
    modal && modal.close();
  },

  buildEditor(codeName, theme, label) {
    const input = document.createElement('textarea');
    !this.codeMirror && (this.codeMirror = this.cm.getViewer('CodeMirror'));

    const el = this.codeMirror.clone().set({
      label,
      codeName,
      theme,
      readOnly: 0,
      input
    });

    const $el = new this.cm.EditorView({
      model: el,
      config: this.cm.getConfig()
    }).render().$el;

    el.init(input);

    return { el, $el };
  }
};
