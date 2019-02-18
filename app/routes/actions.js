const fs = require('fs');
const ST = require('stjs');
const bodybuilder = require('bodybuilder');
const CsvReadableStream = require('csv-reader');
const elasticsearch = require('elasticsearch');
const {VM, VMScript} = require('vm2');

const ESClient = new elasticsearch.Client({
  host: 'localhost:9200'
});

const convert = async (req, res) => {
  const proxyHandler = {
    get: (obj, name) => {
      return `{{${name}}}`;
    }
  }
  const magic = {}
  const data = new Proxy(magic, proxyHandler);

  const vm = new VM({
    timeout: 1000,
    sandbox: {bodybuilder, data}
  });

  const code = `bodybuilder()
${req.body.data}
.build()`;
  try {
    const query = vm.run(code);
    res.json({ok: true, query})
  } catch (e) {
    try {
      new VMScript(code).compile()
      res.json({ok: false, error: `${code}\n\n${e.stack.split('\n\n')[0]}\n${e.message}`})
    } catch(e) {
      const error = `${code}\n\n${e.stack.split('\n\n')[0]}\n${e.message}`
      res.json({ok: false, error})
    }
  }

};

const importCsvToEs = async (req,res) => {
  try {
    let first = false;
    let fields;

    const filename = `/tmp/${req.files.csv.name}`;

    fs.writeFileSync(filename, req.files.csv.data, 'utf-8')
    const inputStream = fs.createReadStream(filename, 'utf8');

    const data = []

    inputStream
      .pipe(CsvReadableStream({ delimiter: ';' }))
      .on('data', async function (row) {
        if(first !== true) {
          first = true;
          fields = row;
        } else {
          let datum = {};
          fields.forEach((field, index) => {
            if(['list of field to convert to int', 'id'].indexOf(field) !== -1) {
              datum[field] = parseInt(row[index], 10);
            } else {
              datum[field] = row[index];
            }

          })
          data.push(datum);
        }
      })
      .on('end', async function () {
          for(let i = 0; i < data.length; i++) {
            const datum = data[i];
            const req = {
              index: req.query.index || process.env.ES_INDEX,
              type: 'entry',
              id: datum.id,
              body: datum,
            }
            await ESClient.index(req);
          }
          res.json({ok: true, message: `${data.length} rows inserted`})
      });
  } catch (e) {
    res.json({ok: false, message: e.message})
  }
}

const applyTest = async (req, res) => {
  const parsed = ST.select(req.body.testData)
    .transformWith(req.body.esQuery)
    .root();
  try {
    const result = await ESClient.search({
      index: req.query.index || process.env.ES_INDEX,
      body: parsed,
      size: 5,
    })
    res.json({ok: true, result, parsed})
  } catch(e) {
    res.json({ok: false, message: e.message})
  }
}

const dropIndex = async (req, res) => {
  try {
    const result = await ESClient.indices.delete({
      index: req.query.index || process.env.ES_INDEX
    })
    res.json({ok: true, result})
  } catch (e) {
    res.json({ok: false, result: e.message})
  }

}

module.exports = {
  create: router => {
    router.post('/convert', convert);
    router.post('/importCsvToEs', importCsvToEs)
    router.post('/applyTest', applyTest)
    router.delete('/dropIndex', dropIndex)
  },
};
