const core = require('@actions/core');
const github = require('@actions/github');
const axios = require('axios');

(async () => {
    try {
        const default_urls = 'https://evaly.com.bd,https://www.pickaboo.com,https://www.daraz.com.bd/';
        const splitter = core.getInput('splitter') ? core.getInput('splitter') : ',';
        const action_urls = core.getInput('urls');
        const urls = action_urls ? action_urls.split(splitter) : default_urls.split(splitter);
        const psi = 'https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed';
        const token = process.env.GC_TOKEN;
        const gh_token = process.env.GH_TOKEN;
        const allReports = [];

        if (!token) {
            const psi_key_link = 'https://developers.google.com/speed/docs/insights/v5/get-started#key';
            core.setFailed(`Please set Google Cloud token as secret in the environment. To get a key, visit: ${psi_key_link}`);
        }

        if (!urls || urls.length === 0) {
            core.setFailed('At least an URL is required to render report.')
        }

        urls.forEach(async (url, index) => {
            const config = {
                method: 'get',
                url: `${psi}?key=${token}&url=${url}`
            };

            axios(config)
                .then(function (res) {
                    const lh = res.data.lighthouseResult.audits;

                    const body = JSON.stringify({
                        "firstContentfulPaint": lh['first-contentful-paint'].numericValue,
                        "timeToInteractive": lh['interactive'].numericValue,
                        "serverResponseTime": lh['server-response-time'].numericValue,
                        "bootUpTime": lh['bootup-time'].numericValue,
                        "firstMeaningfulPaint": lh['first-meaningful-paint'].numericValue,
                        "totalBlockingTime": lh['total-blocking-time'].numericValue,
                        "totalByteWeight": lh['total-byte-weight'].numericValue,
                        "firstCpuIdle": lh['first-cpu-idle'].numericValue,
                        "largestContentfulPaint": lh['largest-contentful-paint'].numericValue
                    });

                    const request_config = {
                        method: 'post',
                        url: 'https://uxability-api.herokuapp.com/api/reports/findByIssue',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        data: body
                    };

                    axios(request_config)
                        .then(async function (report) {
                            const response = report.data;

                            console.log(`URL: ${url}`);
                            if (response.report.userExperienceScore < 4300) {
                                console.log("Congratulations 🎉");
                                console.log(`${url} is already serving the best user experience.\n`);
                            }

                            allReports.push({
                                url: url,
                                impact: response.report.impact,
                                score: response.report.userExperienceScore
                            });

                            if (index === allReports.length - 1 && allReports.length === urls.length) {
                                const octokit = github.getOctokit(gh_token);
                                const title = `User Experience Report 📝: ${new Date().toString()}`;
                                
                                await octokit.issues.create({
                                    ...github.context.repo,
                                    title,
                                    body: toTable(allReports)
                                });
                            }
                            console.table(response.report.impact);
                        })
                        .catch(function (error) {
                            console.log(error);
                        });
                })
                .catch(function (error) {
                    console.log(error);
                });
        });



        console.log('Issue Created Successfully');

    } catch (error) {
        core.setFailed(error.message);
    }
})();


const camelCaseToTitle = camelCase => {
    if (!camelCase) {
        return '';
    }

    let pascalCase = camelCase.charAt(0).toUpperCase() + camelCase.substr(1);
    return pascalCase
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
        .replace(/([a-z])([0-9])/gi, '$1 $2')
        .replace(/([0-9])([a-z])/gi, '$1 $2');
}

const toTable = all => {
    let result = '';

    all.forEach(a => {
        const s = a.impact;
        const url = a.url;
        const score = a.score;

        let cols = [];
        for (let k in s) {
            for (let c in s[k]) {
                if (cols.indexOf(c) === -1) cols.push(c);
            }
        }
        let url_md = `<h3><b>URL:</b> <a href='${url}'>${url}</a></h3>`;

        if (score < 4300) {
            url_md += `
            <h4>Cheers 🎉🎉 ${url} is already serving the best user experience.</h4>
            <p><img src="https://p7.hiclipart.com/preview/534/433/205/doraemon-animation-clip-art-doraemon.jpg" height="200" alt="gif" /></p>    
        `
        }

        let html = url_md +
            '<table><thead><tr><th></th>' +
            cols.map((c) => '<th>' + camelCaseToTitle(c) + '</th>').join('') +
            '</tr></thead><tbody>';
        for (let l in s) {
            html +=
                '<tr><th>' + camelCaseToTitle(l) + '</th>' +
                cols.map((c) => '<td>' + (s[l][c] || '') + '</td>').join('') +
                '</tr>';
        }
        html += '</tbody></table><br>';

        result += html;
    });

    return result;
};
