var toolbarOptions = [
  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
  [{ 'font': [] }],
  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
  ['blockquote', 'code-block'],
  ['link','image'],
  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
  [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
  [{ 'align': [] }],
  ['clean']                                         // remove formatting button
],
options = {
        // debug: 'info',
        theme: 'snow',
        placeholder: '请输入文章内容。',
        modules: {
            toolbar: toolbarOptions
        }
    },
    editor = new Quill('#editor', options);
    editor.on('text-change',function(delta,oldDelta,source){
console.log(delta);
console.log(source);
let text = editor.getContents();
console.log(JSON.stringify(text));
    })
