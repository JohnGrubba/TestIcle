const dropbox = document.getElementById("dropbox") // This is just an example for using a box where you can drop files

function setup_drag_listeners() { // Handling all events which correspond to droping an element on the page
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropbox.addEventListener(eventName, preventDefaults, false)
    })

    /*['dragenter', 'dragover'].forEach(eventName => { // Add for higlighting on these events
    dropbox.addEventListener(eventName, highlight, false)
    })

    ['dragleave', 'drop'].forEach(eventName => {
    dropbox.addEventListener(eventName, unhighlight, false)
    })*/

    dropbox.addEventListener('drop', handleDrop, false);
}

function preventDefaults(e) { // Prevent reloading and moving of page
  e.preventDefault();
  e.stopPropagation();
}

/*function highlight(e) {
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
        dropbox.classList.add('dragover');
        }
}

function unhighlight(e) {
  dropbox.classList.remove('dragover');
}*/

function handleDrop(event) {
  console.log('Hey u dropped this')
  const files = event.dataTransfer.files;
  console.log(files[0].name)

  let formData = new FormData()
  formData.append('content', files[0])
  formData.append('name', files[0].name)

  fetch('/api/drop', {
    method: 'POST',
    body: formData
  })
  .then(response => {
    if (!response.ok) {
      return;
    }
    return response.text();
  })
  .catch(error => {
    console.log(error);
    return
  });
}

setup_drag_listeners()