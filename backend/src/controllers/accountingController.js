const { Account, JournalEntry } = require('../models');

exports.listAccounts = async (req, res, next) => {
  try {
    const accounts = await Account.find({ isActive: true }).sort({ code: 1 });
    res.json(accounts.map(a => a.toJSON()));
  } catch (e) { next(e); }
};

exports.createAccount = async (req, res, next) => {
  try {
    const account = await Account.create(req.body);
    res.status(201).json(account.toJSON());
  } catch (e) { next(e); }
};

exports.updateAccount = async (req, res, next) => {
  try {
    const a = await Account.findById(req.params.id);
    if (!a) return res.status(404).json({ error: 'Account not found' });
    if (a.isSystem) return res.status(400).json({ error: 'Cannot modify system accounts' });
    Object.assign(a, req.body);
    await a.save();
    res.json(a.toJSON());
  } catch (e) { next(e); }
};

exports.listJournal = async (req, res, next) => {
  try {
    const { from, to, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (from || to) { filter.date = {}; if (from) filter.date.$gte = new Date(from); if (to) filter.date.$lte = new Date(to); }

    const [total, rows] = await Promise.all([
      JournalEntry.countDocuments(filter),
      JournalEntry.find(filter).sort({ date: -1 }).skip((page - 1) * +limit).limit(+limit)
        .populate('lines.accountId', 'name code'),
    ]);
    res.json({ total, page: +page, data: rows.map(je => {
      const obj = je.toJSON();
      obj.lines = obj.lines.map(l => ({ ...l, account: l.accountId }));
      return obj;
    })});
  } catch (e) { next(e); }
};

exports.getJournal = async (req, res, next) => {
  try {
    const je = await JournalEntry.findById(req.params.id).populate('lines.accountId', 'name code');
    if (!je) return res.status(404).json({ error: 'Not found' });
    const obj = je.toJSON();
    obj.lines = obj.lines.map(l => ({ ...l, account: l.accountId }));
    res.json(obj);
  } catch (e) { next(e); }
};

exports.createJournal = async (req, res, next) => {
  try {
    const { lines = [], ...header } = req.body;
    const totalDebit = lines.reduce((s, l) => s + (+l.debit || 0), 0);
    const totalCredit = lines.reduce((s, l) => s + (+l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return res.status(400).json({ error: 'Journal entry must balance (debit = credit)' });
    }
    const je = await JournalEntry.create({ ...header, createdById: req.user._id, lines });
    // Update account balances
    for (const line of lines) {
      const delta = (+line.debit || 0) - (+line.credit || 0);
      await Account.findByIdAndUpdate(line.accountId, { $inc: { currentBalance: delta } });
    }
    res.status(201).json(je.toJSON());
  } catch (e) { next(e); }
};
