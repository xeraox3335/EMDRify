/*
  EMDRify monitor setup

  mode:
    - 'single-fullscreen'  => App opens in true fullscreen on one monitor.
    - 'manual-span'        => App spans the exact monitors listed in monitorIndexes.

  monitorIndexes are based on displays sorted by x-position (left -> right).
  Example for three monitors in order: [0, 1, 2]
*/

module.exports = {
  mode: 'single-fullscreen',
  monitorIndexes: [0]
};
