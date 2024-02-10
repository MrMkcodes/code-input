/**
 * Add basic Go-To-Line (Ctrl+G by default) functionality to the code editor.
 * Files: go-to-line.js / go-to-line.css
 */
codeInput.plugins.GoToLine = class extends codeInput.Plugin {
    useCtrlG = false;

    /**
     * Create a go-to-line command plugin to pass into a template
     * @param {boolean} useCtrlG Should Ctrl+G be overriden for go-to-line functionality? If not, you can trigger it yourself using (instance of this plugin)`.showPrompt(code-input element)`.
     */
    constructor(useCtrlG = true) {
        super([]); // No observed attributes
        this.useCtrlG = useCtrlG;
    }

    /* Add keystroke events */
    afterElementsAdded(codeInput) {
        const textarea = codeInput.textareaElement;
        if(this.useCtrlG) {
            textarea.addEventListener('keydown', (event) => { this.checkCtrlG(codeInput, event); });
        }
    }

    blockSearch(dialog, event) {
        if (event.ctrlKey && event.key == 'g') {
            return event.preventDefault();
        }
    }

    checkPrompt(dialog, event) {
        // Line number(:column number)
        const lines = dialog.textarea.value.split('\n');
        const maxLineNo = lines.length;
        const lineNo = Number(dialog.input.value.split(':')[0]);
        let columnNo = 0; // Means go to start of indented line
        let maxColumnNo = 1;
        const querySplitByColons = dialog.input.value.split(':');
        if(querySplitByColons.length > 2) return dialog.input.classList.add('code-input_go-to_error');


        if (event.key == 'Escape') return this.cancelPrompt(dialog, event);

        if (dialog.input.value) {
            if (!/^[0-9:]*$/.test(dialog.input.value) || lineNo < 1 || lineNo > maxLineNo) {
                return dialog.input.classList.add('code-input_go-to_error');
            } else {
                // Check if line:column
                if(querySplitByColons.length >= 2) {
                    columnNo = Number(querySplitByColons[1]);
                    maxColumnNo = lines[lineNo-1].length;
                }
                if(columnNo < 0 || columnNo > maxColumnNo) {
                    return dialog.input.classList.add('code-input_go-to_error');
                } else {
                    dialog.input.classList.remove('code-input_go-to_error');
                }
            }
        }

        if (event.key == 'Enter') {
            this.goTo(dialog.textarea, lineNo, columnNo);
            this.cancelPrompt(dialog, event);
        }
    }

    cancelPrompt(dialog, event) {
        let delay;
        event.preventDefault();
        dialog.textarea.focus();

        // Remove dialog after animation
        dialog.classList.add('code-input_go-to_hidden-dialog');
        dialog.input.value = "";

        if (dialog.computedStyleMap) {
            delay = 1000 * dialog.computedStyleMap().get('animation').toString().split('s')[0];
        } else {
            delay = 1000 * document.defaultView.getComputedStyle(dialog, null).getPropertyValue('animation').split('s')[0];
        }
    }

    /**
     * Show a search-like dialog prompting line number.
     * @param {codeInput.CodeInput} codeInput the `<code-input>` element.
    */
    showPrompt(codeInput) {
        if(codeInput.pluginData.goToLine == undefined || codeInput.pluginData.goToLine.dialog == undefined) {
            const textarea = codeInput.textareaElement;

            const dialog = document.createElement('div');
            const input = document.createElement('input');
            const cancel = document.createElement('span');

            dialog.appendChild(input);
            dialog.appendChild(cancel);

            dialog.className = 'code-input_go-to_dialog';
            input.spellcheck = false;
            input.placeholder = "Line:Column / Line no. then Enter";
            dialog.codeInput = codeInput;
            dialog.textarea = textarea;
            dialog.input = input;

            input.addEventListener('keydown', (event) => { this.blockSearch(dialog, event); });
            input.addEventListener('keyup', (event) => { this.checkPrompt(dialog, event); });
            cancel.addEventListener('click', (event) => { this.cancelPrompt(dialog, event); });

            codeInput.appendChild(dialog);
            codeInput.pluginData.goToLine = {dialog: dialog};
            input.focus();
        } else {
            codeInput.pluginData.goToLine.dialog.classList.remove("code-input_go-to_hidden-dialog");
            codeInput.pluginData.goToLine.dialog.querySelector("input").focus();
        }
    }

    /* Set the cursor on the first non-space char of textarea's nth line; and scroll it into view */
    goTo(textarea, lineNo, columnNo = 0) {
        let fontSize;
        let lineHeight;
        let scrollAmount;
        let topPadding;
        let cursorPos = -1;
        let lines = textarea.value.split('\n');

        if (lineNo > 0 && lineNo <= lines.length) {
            if (textarea.computedStyleMap) {
                fontSize = textarea.computedStyleMap().get('font-size').value;
                lineHeight = fontSize * textarea.computedStyleMap().get('line-height').value;
            } else {
                fontSize = document.defaultView.getComputedStyle(textarea, null).getPropertyValue('font-size').split('px')[0];
                lineHeight = document.defaultView.getComputedStyle(textarea, null).getPropertyValue('line-height').split('px')[0];
            }

            // scroll amount and initial top padding (3 lines above, if possible)
            scrollAmount = (lineNo > 3 ? lineNo - 3 : 1) * lineHeight;
            topPadding = (lineHeight - fontSize) / 2;

            if (lineNo > 1) {
                // cursor positon just after n - 1 full lines
                cursorPos = lines.slice(0, lineNo - 1).join('\n').length;
            }

            // scan first non-space char in nth line
            if (columnNo == 0) {
                do cursorPos++; while (textarea.value[cursorPos] != '\n' && /\s/.test(textarea.value[cursorPos]));
            } else {
                cursorPos += 1 + columnNo - 1;
            }

            textarea.scrollTop = scrollAmount - topPadding;
            textarea.setSelectionRange(cursorPos, cursorPos);
            textarea.click();
        }
    }

    /* Event handlers */
    checkCtrlG(codeInput, event) {
        const textarea = codeInput.textareaElement;
        if (event.ctrlKey && event.key == 'g') {
            event.preventDefault();

            this.showPrompt(codeInput);
        }
    }
}
