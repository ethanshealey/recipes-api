const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const app = express()

let db = new sqlite3.Database('./ethanAPI.db', (e) => {
    if(e)
        return console.log(e)
    console.log('db successfully started')
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

app.get('/recipes', (req, res) => {
    let sql = `SELECT * FROM recipes`

        db.all(sql, [], (e, rows) => {
            if(e) {
                return console.log(`There was an error. ${e}`)
            }
            if(rows.length == 0) {
                return res.status(200).send('There are no recipes yet :(')
            }
            let data = []

            rows.forEach((recipe) => {
                console.log(recipe)
                data.push({id: recipe.rec_id, name: recipe.name, ingredients: JSON.parse(recipe.ingredients), instructions: JSON.parse(recipe.instructions), cook_time: recipe.cook_time, date_modified: recipe.date_modified})
            })

            res.status(200).send(data)
        })
})

app.get('/recipes/:id', (req, res) => {

    const { id } = req.params

    if(typeof id != "string") {
        return !isNaN(id) && !isNaN(parseFloat(id))
    }

    else {
        let sql = `SELECT * FROM recipes WHERE recipes.rec_id = ${id}`

        db.all(sql, [], (e, rows) => {
            if(e) {
                return console.log(`error finding recipe: ${e}`)
            }

            if(rows.length == 0) {
                return res.status(404).send('Error: Recipe Not Found')
            }

            let data = {id: rows[0].rec_id, name: rows[0].name, ingredients: JSON.parse(rows[0].ingredients), instructions: JSON.parse(rows[0].instructions), cook_time: rows[0].cook_time, date_modified: rows[0].date_modified}

            res.status(200).send(data)
        })
    }
})

app.post('/recipes', (req, res) => {
    if(req.body.name === undefined || req.body.ingredients === undefined || req.body.instructions === undefined || req.body.cook_time === undefined) {
        return res.status(400).send('Incomplete recipe')
    }
    else {
        
        db.all(`SELECT COUNT(*) as 'count' FROM recipes`, [], (e, rows) => {

            const date = new Date().toISOString().slice(0, 10)
            let sql = `INSERT INTO recipes(rec_id, name, ingredients, instructions, cook_time, date_modified) values('${rows[0].count + 1}', '${req.body.name}', '${arrayToString(req.body.ingredients)}', '${arrayToString(req.body.instructions)}', '${req.body.cook_time}', '${date}')`

            if(e) {
                console.log(e)
                res.status(400).send(`${e}`)
            }

            db.run(sql, (e) => {
                if(e) {
                    console.log(e)
                    res.status(400).send(`${e}`)
                }
                else {
                    res.status(200).send(`Recipe ${req.body.name} added!`)
                }
            })
        })
    }
})

app.delete('/recipes/:id', (req, res) => {
    const { id } = req.params
    db.run(`DELETE FROM recipes WHERE rec_id=${id}`, [], (e) => {
        if(e) 
            res.status(400).send(`${e}`)
        else
            res.status(200).send('Recipe deleted!')
    })
})

app.listen(process.env.PORT || 5000, () => {
    console.log(`running`)
})