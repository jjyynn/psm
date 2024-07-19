import fs from 'fs';
import Papa from 'papaparse';

const filePath = 'PSMrawdata.csv';

// read csv file
fs.readFile(filePath, 'utf8', (err, data) => {

  // CSV data parsing
  Papa.parse(data, {
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      let dataArray = results.data;

      const sampleIds = dataArray.map(row => row['sample number']);
      const expensive = dataArray.map(row => parseFloat(row['高い']));
      const cheap = dataArray.map(row => parseFloat(row['安い']));
      const tooExpensive = dataArray.map(row => parseFloat(row['高すぎる']));
      const tooCheap = dataArray.map(row => parseFloat(row['安すぎる']));

      // check min, max 
      const allValues = [...expensive, ...cheap, ...tooExpensive, ...tooCheap];
      
      const minValue = Math.min(...allValues); //88
      const maxValue = Math.max(...allValues);  //600
      const step = 50;

      // make array
      const ranges = Array.from({length: Math.ceil((maxValue - step + 1) / step)}, (_, i) => step + i * step);

      // ratio function
      const calculateRatios = (data: number[], condition: (value: number, threshold: number) => boolean) => {
        return ranges.map(range => {
          const count = data.filter(value => condition(value, range)).length;
          return count / data.length;
        });
      };

      // calculate ratio
      const expensiveRatios = calculateRatios(expensive, (value, threshold) => value <= threshold);
      const tooExpensiveRatios = calculateRatios(tooExpensive, (value, threshold) => value <= threshold);
      const cheapRatios = calculateRatios(cheap, (value, threshold) => value >= threshold);
      const tooCheapRatios = calculateRatios(tooCheap, (value, threshold) => value >= threshold);

      // function for intersection value
      const findIntersection = (ratios1: number[], ratios2: number[], values1: number[], values2: number[]) => {
        for (let i = 1; i < ranges.length; i++) {
          if (
            (ratios1[i - 1] > ratios2[i - 1] && ratios1[i] <= ratios2[i]) ||
            (ratios1[i - 1] < ratios2[i - 1] && ratios1[i] >= ratios2[i])
          ) {

            const x1 = ranges[i - 1], r1 = ratios1[i - 1]; //p1
            const x2 = ranges[i], r2 = ratios1[i];  //p2
            const x3 = ranges[i - 1], r3 = ratios2[i - 1]; //p3
            const x4 = ranges[i], r4 = ratios2[i]; //p4

            const intersectValue = ((r3-r1)*(x1-x2)*(x3-x4)+x1*(r1-r2)*(x3-x4)-x3*(r3-r4)*(x1-x2))/((r1-r2)*(x3-x4)-(x1-x2)*(r3-r4))
            return intersectValue;
          }
        }
        return null;
      };

      // calculate intersection value
      const bestPrice = findIntersection(tooExpensiveRatios, cheapRatios, ranges, ranges);
      const negoPrice = findIntersection(expensiveRatios, cheapRatios, ranges, ranges);
      const idealPrice = findIntersection(tooExpensiveRatios, tooCheapRatios, ranges, ranges);
      const assurPrice = findIntersection(expensiveRatios, tooCheapRatios, ranges, ranges);

      // result
      console.log('最高価格:', Math.ceil(bestPrice), '円');
      console.log('妥協価格:', Math.ceil(negoPrice), '円');
      console.log('理想価格:', Math.ceil(idealPrice), '円');
      console.log('最低品質保証価格:', Math.ceil(assurPrice), '円');
    },

  });
});
