var element = document.getElementById('edit_editor') || document.getElementById("post_editor") || document.getElementById('comment_editor'),
    option = {
        element: element,
        autofocus: element.id === 'edit_editor' ? true : false,
        placeholder: element.id === 'comment_editor'?'留言区～这里也可以用 markdown 语法哦！':'请愉快地使用 markdown 写作吧！～',
        renderingConfig: {
            singleLineBreaks: false,
            codeSyntaxHighlighting: true,
        },
        forceSync: true,
        spellChecker: false,
        styleSelectedText: false,
        showIcons: ["code"]
    };

if (element.id === 'comment_editor') {
 option.toolbar = false;
}

var simplemde = new SimpleMDE(option);
