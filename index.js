const express = require('express')
const mysql = require('mysql'); 
const path = require('path');
const app = express()

const db = mysql.createPool({
    connectionLimit: 5,
    host: "us-cdbr-east-04.cleardb.com",
    user: "b2e411a569a9d5",
    password: "24870c65",
    database: "heroku_07aaca3efc45bdf"
})

const arrayToString = arr => {

    let str = "["

    arr.forEach((item) => {
        str += `"` + item + `",`
    })

    str = str.slice(0, -1) + "]"

    return str
}

app.use(express.json())

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/index.html'))
})

app.get('/recipes', (req, res) => {

    let sql = `SELECT * FROM recipes`

    
    db.query(sql, (e, rows, fields) => {
        if(e) {
            return res.status(400).send(`${e}`)
        }

        if(rows.length == 0) {
            return res.status(200).send(`No recipes have been added yet :(`)
        }

        let data = []

        rows.forEach((recipe) => {
            console.log(recipe)
            data.push({id: recipe.rec_id, name: recipe.name, ingredients: JSON.parse(recipe.ingredients), instructions: JSON.parse(recipe.instructions), cook_time: recipe.cook_time, date_modified: recipe.date_modified})
        })

        return res.status(200).send(data)
    })
    
    
})

app.get('/recipes/:id', (req, res) => {

    const { id } = req.params

    if(typeof id != "string") {
        return !isNaN(id) && !isNaN(parseFloat(id))
    }

    else {

        let sql = `SELECT * FROM recipes WHERE rec_id=${id}`
        db.query(sql, (e, rows, field) => {
            if(e) {
                return res.status(400).send(`${e}`)
            }

            if(rows.length == 0) {
                return res.status(404).send('Error: Recipe Not Found')
            }

            let data = {id: rows[0].rec_id, name: rows[0].name, ingredients: JSON.parse(rows[0].ingredients), instructions: JSON.parse(rows[0].instructions), cook_time: rows[0].cook_time, date_modified: rows[0].date_modified}

            return res.status(200).send(data)
        })
    }
})

app.post('/recipes', (req, res) => {
    
    if(req.headers.authorization === process.env.TOKEN) {
        if(req.body.name === undefined || req.body.ingredients === undefined || req.body.instructions === undefined || req.body.cook_time === undefined) {
            return res.status(400).send('Incomplete recipe')
        }
        else {

            const date = new Date().toISOString().slice(0, 10)
            let sql = `INSERT INTO recipes(name, ingredients, instructions, tags, cook_time, date_modified) values('${req.body.name}', '${arrayToString(req.body.ingredients)}', '${arrayToString(req.body.instructions)}', '${req.body.tags}', '${req.body.cook_time}', '${date}')`
            db.query(sql, (e) => {
                if(e) 
                    return res.status(400).send(`${e}`)
                return res.status(200).send(`1 record added: ${req.body.name}`)
            })
        }
    }
})

app.post('/recipes/:id', (req, res) => {
    if(req.body.name === undefined || req.body.ingredients === undefined || req.body.instructions === undefined || req.body.cook_time === undefined) {
        return res.status(400).send('Incomplete recipe')
    }
    const { id } = req.params
    const date = new Date().toISOString().slice(0, 10)
    db.query(`UPDATE recipes SET name='${req.body.name}', ingredients='${arrayToString(req.body.ingredients)}', instructions='${arrayToString(req.body.instructions)}', date_modified='${date}', cook_time='${req.body.cook_time}' WHERE rec_id=${id}`, (e) => {
        if(e) {
            console.log(e)
            return res.status(400).send(`${e}`)
        }
        return res.status(200).send(`1 recorded updated: ${req.body.name}`)
    })
})

app.delete('/recipes/:id', (req, res) => {
    const { id } = req.params
    db.query(`DELETE FROM recipes WHERE rec_id=${id}`, (e) => {
        if(e)
            return res.status(400).send(`${e}`)
        else
            return res.status(200).send('Recipe deleted!')
    })
})

app.listen(process.env.PORT || 5000, () => {
    console.log(`running`)
})