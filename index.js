require('dotenv').config();
const express = require('express');
const csv = require('csv-parser');
const fs = require('fs');
const { Client } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

// const client = new Client({connectionString: 'postgres://postgres:*****@localhost:5432'});
const client = new Client({
    user:     process.env.DB_USER,
    host:     process.env.DB_HOST,
    password: process.env.DB_PASSWORD,
    port:     process.env.DB_PORT
});
client.connect(err => err && console.error('*** connect error: ' + err));

// calculates and prints age distribution of users in DB
async function calculateAgeDistribution() {
    try {
        const query = `
        SELECT
          SUM(CASE WHEN age < 20 THEN 1 ELSE 0 END) AS count_20,
          SUM(CASE WHEN age BETWEEN 20 AND 40 THEN 1 ELSE 0 END) AS count_40,
          SUM(CASE WHEN age BETWEEN 41 AND 60 THEN 1 ELSE 0 END) AS count_60,
          SUM(CASE WHEN age > 60 THEN 1 ELSE 0 END) AS count_gt_60,
          COUNT(*) AS total_users
        FROM public.users`;

        const result = await client.query(query);
        const totalUsers = parseInt(result.rows[0]?.total_users);
        if (totalUsers && totalUsers < 1) {
            throw new Error('No users found');
        }

        const distribution = {
            '< 20':     ((parseInt(result.rows[0]?.count_20) / totalUsers) * 100),
            '20 to 40': ((parseInt(result.rows[0]?.count_40) / totalUsers) * 100),
            '41 to 60': ((parseInt(result.rows[0]?.count_60) / totalUsers) * 100),
            '> 60':     ((parseInt(result.rows[0]?.count_gt_60) / totalUsers) * 100)
        };

        console.log('Age-Group\t| % Distribution');
        console.log('---------------------------------');
        Object.keys(distribution).forEach(key => {
            const padding = ' '.repeat(14 - key.length);
            console.log(key, padding, '|', distribution[key]);
        });
        console.log('---------------------------------');
    } catch (err) {
        console.error('Error calculating age distribution:', err);
    }
}

// route to handle file upload and conversion
app.post('/upload', (req, res) => {
    try {
        const csvFilePath = process.env.CSV_FILE_PATH;
        const results = [];

        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on('data', (row) => {
                if (Object.keys(row).length === 0) {
                    return;
                }
                const user = {
                    name:            row['name.firstName'] + ' ' + row['name.lastName'],
                    age:             parseInt(row['age']),
                    additional_info: {}
                };

                const mandatoryFields = ['name.firstName', 'name.lastName', 'age'];
                Object.keys(row).forEach((key) => {
                    if (!mandatoryFields.includes(key) && row[key] !== undefined && row[key] !== null && row[key] !== '') {
                        const props = key.split('.');
                        let parentObj = user.additional_info;
                        // traverse to the parent of leaf property and create it if doesn't exist
                        for (let i = 0; i < props.length - 1; i++) {
                            if (!parentObj[props[i]]) {
                                parentObj[props[i]] = {};
                            }
                            parentObj = parentObj[props[i]];
                        }
                        parentObj[props[props.length - 1]] = row[key];
                    }
                });

                results.push(user);
            })
            .on('end', async () => {
                // Insert data into PostgreSQL database given that all users are parsed without throwing an exception
                const query = 'INSERT INTO public.users (name, age, additional_info) VALUES($1, $2, $3) RETURNING *';
                for (const user of results) {
                    try {
                        await client.query(query, [user.name, user.age, user.additional_info]);
                    } catch (err) {
                        console.error(`* Error inserting user - ${user.name} : ${err.message}`);
                    }
                }
                await calculateAgeDistribution();
                res.status(200).send('File uploaded and data inserted successfully.');
            });
    } catch (err) {
        console.error('Error processing file:', err);
        res.status(500).send('Internal server error.');
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
