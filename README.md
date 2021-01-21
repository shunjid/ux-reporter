<div align="center"> 
  <img height="250" src="assets/banner.png"/>
</div>

# UX Reporter

CI/CD action that helps you prioritizing web issues along with prediction of improvements your site is going to have after following unit of issue improvement.

## Usage

To use this GitHub Action you have to provide these information in your workflow yml. **All the information are required**.

- **GC_TOKEN** : [API key](https://developers.google.com/speed/docs/insights/v5/get-started#key) for pagespeed insights.
- **GH_TOKEN** : GitHub provided personal access [token](https://github.com/settings/tokens).
- **urls** : Site urls you want to perform user experience prediction.
- **splitter**: Separator that separates your urls string into list of URL's. In example below comma ( **,** ) is the separator.

```yml
on: [push]

jobs:
  test_impact:
    runs-on: ubuntu-latest
    name: A job to test impact
    steps:
      - name: Checkout
        uses: actions/checkout@v2
      - name: UX Reporter
        uses: shunjid/ux-reporter@v1.1
        env:
          GC_TOKEN: ${{ secrets.GC_TOKEN }}
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
        id: urls
        with:
          urls: 'https://shunjid.github.io,https://diu.edu.bd'
          splitter: ','
```
