var element = document.getElementById('edit_editor') || document.getElementById("post_editor") || document.getElementById('comment_editor'),
    simplemde = new SimpleMDE({
        element: element,
        autofocus: element.id === 'edit_editor' ? true : false,
        placeholder: '请愉快地使用 markdown 写作吧！～',
        renderingConfig: {
            singleLineBreaks: false,
            codeSyntaxHighlighting: true,
        },
        forceSync: true,
        spellChecker: false,
        styleSelectedText: false,
        toolbar: element.id === 'comment_editor' ? false : true,
        status: element.id === 'comment_editor' ? false : true,
        showIcons: ["code"]
    });
