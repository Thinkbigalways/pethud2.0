/**
 * Simple search controller stub.
 * Currently just echoes back the query/filter and renders the search page
 * with an empty results array.
 */

async function showSearchPage(req, res, next) {
  try {
    const user = res.locals.user || null;
    const query = (req.query.q || '').trim();
    const filter = req.query.filter || 'feeds';

    const results = [];

    return res.render('search', {
      title: 'Search',
      user,
      query,
      filter,
      results,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = {
  showSearchPage,
};


