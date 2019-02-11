window.onload = () => {
  function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function createEditor(id, language = 'javascript') {
    const textarea = ace.edit(id);
    textarea.getSession().setUseWorker(false);
    textarea.setTheme('ace/theme/monokai');
    textarea.getSession().setMode(`ace/mode/${language}`);
    return textarea
  }

  function testJson(event, editor) {
    const alertInvalidjson = document.getElementById(`alert-invalidjson-${editor.id}`)
    const btnApplytest = document.getElementById('btn-applytest');
    try {
      JSON.parse(editor.getValue())
      alertInvalidjson.style.display = 'none';
      btnApplytest.style.display = 'inline-block';
    } catch(e) {
      alertInvalidjson.style.display = 'block';
      btnApplytest.style.display = 'none';
    }
  }

  let bbTimer;

  const textareaBodybuilder = createEditor('textarea-bodybuilder');
  textareaBodybuilder.on('change', convert)

  const textareaElasticsearch = createEditor('textarea-elasticsearch', 'json');
  textareaElasticsearch.on('change', testJson)
  const textareaTestdata = createEditor('textarea-testdata', 'json');
  textareaTestdata.on('change', testJson)

  const textareaResult = createEditor('textarea-result', 'json');

  function convert(event, editor) {
    clearTimeout(bbTimer);
    bbTimer = setTimeout(() => {
      const data = editor.getValue();
      localStorage.setItem('bodybuilder', data);
      fetch('/v0/convert', {
        method: 'POST',
        body: JSON.stringify({data}),
        headers:{
          'Content-Type': 'application/json'
        }
      })
      .then(res => res.json())
      .then(res => {
        if(res.ok) {
          textareaElasticsearch.setValue(JSON.stringify(res.query, '', 2))
        } else {
          textareaElasticsearch.setValue(res.error)
        }

      })
    }, 500)
  }

  const savedBodyBuilder = localStorage.getItem('bodybuilder');

  if(savedBodyBuilder) {
    textareaBodybuilder.setValue(savedBodyBuilder)
  }

  convert({}, textareaBodybuilder)

  const btnImportCsvToEs = document.getElementById('btn-importCsvToEs');
  btnImportCsvToEs.addEventListener('click', importCsvToEs)

  const btnApplytest = document.getElementById('btn-applytest');
  btnApplytest.addEventListener('click', applyTest)

  const btnDropindex = document.getElementById('btn-dropindex');
  btnDropindex.addEventListener('click', dropIndex)

  function dropIndex() {
    if(confirm('Are you sure ?')){
      fetch('/v0/dropIndex', {
        method: 'DELETE'
      })
      .then(res => res.json())
      .then(res => {
        alert('Done');
        console.log(res);
      })
    }

  }

  function importCsvToEs() {
    const spinnerImportCsvToEs = document.getElementById('spinner-importCsvToEs');
    const alertImportCsvToEs = document.getElementById('alert-importCsvToEs')
    alertImportCsvToEs.style.display = 'none';
    spinnerImportCsvToEs.style.display = 'inline-block';
    const csvToEsFile = document.querySelector('input[type="file"]')
    const data = new FormData()
    data.append('csv', csvToEsFile.files[0])

    fetch('/v0/importCsvToEs', {
      method: 'POST',
      body: data
    })
    .then(res => res.json())
    .then(res => {
      spinnerImportCsvToEs.style.display = 'none'
      alertImportCsvToEs.style.display = 'block';
      alertImportCsvToEs.textContent = res.message;
    });
  }

  const preview_table = $('#results');
  preview_table.dynatable({
    dataset: {
      records: []
    }
  });
  const dynatable = preview_table.data('dynatable');

  function applyTest() {
    const esQuery = JSON.parse(textareaElasticsearch.getValue())
    const testData = JSON.parse(textareaTestdata.getValue())
    fetch('/v0/applyTest', {
      method: 'POST',
      body: JSON.stringify({esQuery, testData}),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(res => res.json())
    .then(res => {
      if(res.ok) {
        let results;
        if(res.result.aggregations) {
          results = res.result.aggregations
          textareaResult.setValue(JSON.stringify(results, '', 2))
          const records = [];
          const lastColumns = dynatable.records.getFromTable()[0];
          if(lastColumns){
            let countColumnts = Object.keys(lastColumns).length-1;
            while(countColumnts > 0){
              dynatable.domColumns.remove(0);
              countColumnts -= 1;
            }
          } else {
            dynatable.domColumns.remove(0);
          }

          let pos = 0;
          for(let column in records[0]) {
            dynatable.domColumns.add($('<th>'+column+'</th>'), pos += 1);
          }
          dynatable.records.updateFromJson({records});
          dynatable.records.init();
          dynatable.process();

        } else {
          results = res.result.hits.hits.map(hit => {
            return {...hit._source, score: hit._score}
          })
          textareaResult.setValue(JSON.stringify(results, '', 2))
        }
      } else {
        textareaResult.setValue(res.message);
      }

    })
  }
};
