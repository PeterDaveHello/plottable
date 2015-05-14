///<reference path="../testReference.ts" />

var assert = chai.assert;

function generateBasicTable(nRows: number, nCols: number) {
  // makes a table with exactly nRows * nCols children in a regular grid, with each
  // child being a basic component
  var table = new Plottable.Components.Table();
  var components: Plottable.Component[] = [];
  for (var i = 0; i < nRows; i++) {
    for (var j = 0; j < nCols; j++) {
      var r = new Plottable.Component();
      table.addComponent(r, i, j);
      components.push(r);
    }
  }
  return {"table": table, "components": components};
}

describe("Tables", () => {
  it("tables are classed properly", () => {
    var table = new Plottable.Components.Table();
    assert.isTrue(table.classed("table"));
  });

  it("padTableToSize works properly", () => {
    var t = new Plottable.Components.Table();
    assert.deepEqual((<any> t)._rows, [], "the table rows is an empty list");
    (<any> t)._padTableToSize(1, 1);
    var rows = (<any> t)._rows;
    var row = rows[0];
    var firstComponent = row[0];
    assert.lengthOf(rows, 1, "there is one row");
    assert.lengthOf(row, 1, "the row has one element");
    assert.isNull(firstComponent, "the row only has a null component");

    (<any> t)._padTableToSize(5, 2);
    assert.lengthOf(rows, 5, "there are five rows");
    rows.forEach((r: Plottable.Component[]) => assert.lengthOf(r, 2, "there are two columns per row"));
    assert.strictEqual(rows[0][0], firstComponent, "the first component is unchanged");
  });

  it("table constructor can take a list of lists of components", () => {
    var c0 = new Plottable.Component();
    var row1 = [null, c0];
    var row2 = [new Plottable.Component(), null];
    var table = new Plottable.Components.Table([row1, row2]);
    assert.strictEqual((<any> table)._rows[0][1], c0, "the component is in the right spot");
    var c1 = new Plottable.Component();
    table.addComponent(c1, 2, 2);
    assert.strictEqual((<any> table)._rows[2][2], c1, "the inserted component went to the right spot");
  });

  it("tables can be constructed by adding components in matrix style", () => {
    var table = new Plottable.Components.Table();
    var c1 = new Plottable.Component();
    var c2 = new Plottable.Component();
    table.addComponent(c1, 0, 0);
    table.addComponent(c2, 1, 1);
    var rows = (<any> table)._rows;
    assert.lengthOf(rows, 2, "there are two rows");
    assert.lengthOf(rows[0], 2, "two cols in first row");
    assert.lengthOf(rows[1], 2, "two cols in second row");
    assert.strictEqual(rows[0][0], c1, "first component added correctly");
    assert.strictEqual(rows[1][1], c2, "second component added correctly");
    assert.isNull(rows[0][1], "component at (0, 1) is null");
    assert.isNull(rows[1][0], "component at (1, 0) is null");
  });

  it("add a component where one already exists creates a new group", () => {
    var c1 = new Plottable.Component();
    var c2 = new Plottable.Component();
    var c3 = new Plottable.Component();
    var t = new Plottable.Components.Table();

    t.addComponent(c1, 0, 2);
    t.addComponent(c2, 0, 0);
    t.addComponent(c3, 0, 2);

    assert.isTrue(Plottable.Components.Group.prototype.isPrototypeOf((<any> t)._rows[0][2]), "A group was created");

    var components: Plottable.Component[] = (<any> t)._rows[0][2].components();
    assert.lengthOf(components, 2, "The group created should have 2 components");
    assert.strictEqual(components[0], c1, "First element in the group at (0, 2) should be c1");
    assert.strictEqual(components[1], c3, "Second element in the group at (0, 2) should be c3");
  });

  it("add a component where a group already exists adds the component to the group", () => {
    var c1 = new Plottable.Component();
    var c2 = new Plottable.Component();
    var grp = new Plottable.Components.Group([c1, c2]);

    var c3 = new Plottable.Component();

    var t = new Plottable.Components.Table();

    t.addComponent(grp, 0, 2);
    t.addComponent(c3, 0, 2);
    assert.isTrue(Plottable.Components.Group.prototype.isPrototypeOf((<any> t)._rows[0][2]), "The cell still contains a group");

    var components: Plottable.Component[] = (<any> t)._rows[0][2].components();
    assert.lengthOf(components, 3, "The group created should have 3 components");
    assert.strictEqual(components[0], c1, "First element in the group at (0, 2) should still be c1");
    assert.strictEqual(components[1], c2, "Second element in the group at (0, 2) should still be c2");
    assert.strictEqual(components[2], c3, "The Component was added to the existing Group");
  });

  it("adding null to a table cell should throw an error", () => {
    var c1 = new Plottable.Component();
    var t = new Plottable.Components.Table([[c1]]);

    assert.throw(() => t.addComponent(null, 0, 0), "Cannot add null to a table cell");
  });

  it("addComponent works even if a component is added with a high column and low row index", () => {
    // Solves #180, a weird bug
    var t = new Plottable.Components.Table();
    var svg = TestMethods.generateSVG();
    t.addComponent(new Plottable.Component(), 1, 0);
    t.addComponent(new Plottable.Component(), 0, 2);
    t.renderTo(svg); // would throw an error without the fix (tested);
    svg.remove();
  });

  it("basic table with 2 rows 2 cols lays out properly", () => {
    var tableAndcomponents = generateBasicTable(2, 2);
    var table = tableAndcomponents.table;
    var components = tableAndcomponents.components;

    var svg = TestMethods.generateSVG();
    table.renderTo(svg);

    var elements = components.map((r) => (<any> r)._element);
    var translates = elements.map((e) => TestMethods.getTranslate(e));
    assert.deepEqual(translates[0], [0, 0], "first element is centered at origin");
    assert.deepEqual(translates[1], [200, 0], "second element is located properly");
    assert.deepEqual(translates[2], [0, 200], "third element is located properly");
    assert.deepEqual(translates[3], [200, 200], "fourth element is located properly");
    var bboxes = elements.map((e) => Plottable.Utils.DOM.getBBox(e));
    bboxes.forEach((b) => {
      assert.strictEqual(b.width, 200, "bbox is 200 pixels wide");
      assert.strictEqual(b.height, 200, "bbox is 200 pixels tall");
      });
    svg.remove();
  });

  it("table with 2 rows 2 cols and margin/padding lays out properly", () => {
    var tableAndcomponents = generateBasicTable(2, 2);
    var table = tableAndcomponents.table;
    var components = tableAndcomponents.components;
    table.rowPadding(5).columnPadding(5);

    var svg = TestMethods.generateSVG(415, 415);
    table.renderTo(svg);

    var elements = components.map((r) => (<any> r)._element);
    var translates = elements.map((e) => TestMethods.getTranslate(e));
    var bboxes = elements.map((e) => Plottable.Utils.DOM.getBBox(e));
    assert.deepEqual(translates[0], [0, 0], "first element is centered properly");
    assert.deepEqual(translates[1], [210, 0], "second element is located properly");
    assert.deepEqual(translates[2], [0, 210], "third element is located properly");
    assert.deepEqual(translates[3], [210, 210], "fourth element is located properly");
    bboxes.forEach((b) => {
      assert.strictEqual(b.width, 205, "bbox is 205 pixels wide");
      assert.strictEqual(b.height, 205, "bbox is 205 pixels tall");
      });
    svg.remove();
  });

  it("table with fixed-size objects on every side lays out properly", () => {
    var svg = TestMethods.generateSVG();
    var c4 = new Plottable.Component();
    // [0 1 2] \\
    // [3 4 5] \\
    // [6 7 8] \\
    // give the axis-like objects a minimum
    var c1 = TestMethods.makeFixedSizeComponent(null, 30);
    var c7 = TestMethods.makeFixedSizeComponent(null, 30);
    var c3 = TestMethods.makeFixedSizeComponent(50, null);
    var c5 = TestMethods.makeFixedSizeComponent(50, null);
    var table = new Plottable.Components.Table([[null, c1, null],
                                     [c3  , c4, c5  ],
                                     [null, c7, null]]);

    var components = [c1, c3, c4, c5, c7];

    table.renderTo(svg);

    var elements = components.map((r) => (<any> r)._element);
    var translates = elements.map((e) => TestMethods.getTranslate(e));
    var bboxes = elements.map((e) => Plottable.Utils.DOM.getBBox(e));
    // test the translates
    assert.deepEqual(translates[0], [50, 0]  , "top axis translate");
    assert.deepEqual(translates[4], [50, 370], "bottom axis translate");
    assert.deepEqual(translates[1], [0, 30]  , "left axis translate");
    assert.deepEqual(translates[3], [350, 30], "right axis translate");
    assert.deepEqual(translates[2], [50, 30] , "plot translate");
    // test the bboxes
    TestMethods.assertBBoxEquivalence(bboxes[0], [300, 30], "top axis bbox");
    TestMethods.assertBBoxEquivalence(bboxes[4], [300, 30], "bottom axis bbox");
    TestMethods.assertBBoxEquivalence(bboxes[1], [50, 340], "left axis bbox");
    TestMethods.assertBBoxEquivalence(bboxes[3], [50, 340], "right axis bbox");
    TestMethods.assertBBoxEquivalence(bboxes[2], [300, 340], "plot bbox");
    svg.remove();
  });

  it("table space fixity calculates properly", () => {
    var tableAndcomponents = generateBasicTable(3, 3);
    var table = tableAndcomponents.table;
    var components = tableAndcomponents.components;
    components.forEach((c) => TestMethods.fixComponentSize(c, 10, 10));
    assert.isTrue(table.fixedWidth(), "fixed width when all subcomponents fixed width");
    assert.isTrue(table.fixedHeight(), "fixedHeight when all subcomponents fixed height");
    TestMethods.fixComponentSize(components[0], null, 10);
    assert.isFalse(table.fixedWidth(), "width not fixed when some subcomponent width not fixed");
    assert.isTrue(table.fixedHeight(), "the height is still fixed when some subcomponent width not fixed");
    TestMethods.fixComponentSize(components[8], 10, null);
    TestMethods.fixComponentSize(components[0], 10, 10);
    assert.isTrue(table.fixedWidth(), "width fixed again once no subcomponent width not fixed");
    assert.isFalse(table.fixedHeight(), "height unfixed now that a subcomponent has unfixed height");
  });

  it.skip("table.requestedSpace works properly", () => {
    // [0 1]
    // [2 3]
    var c0 = new Plottable.Component();
    var c1 = TestMethods.makeFixedSizeComponent(50, 50);
    var c2 = TestMethods.makeFixedSizeComponent(20, 50);
    var c3 = TestMethods.makeFixedSizeComponent(20, 20);

    var table = new Plottable.Components.Table([[c0, c1], [c2, c3]]);

    var spaceRequest = table.requestedSpace(30, 30);
    TestMethods.verifySpaceRequest(spaceRequest, 30, 30, "1");

    spaceRequest = table.requestedSpace(50, 50);
    TestMethods.verifySpaceRequest(spaceRequest, 50, 50, "2");

    spaceRequest = table.requestedSpace(90, 90);
    TestMethods.verifySpaceRequest(spaceRequest, 70, 90, "3");

    spaceRequest = table.requestedSpace(200, 200);
    TestMethods.verifySpaceRequest(spaceRequest, 70, 100, "4");
  });

  describe("table._iterateLayout works properly", () => {
    // This test battery would have caught #405
    function verifyLayoutResult(result: any,
                                cPS: number[], rPS: number[], gW: number[], gH: number[],
                                wW: boolean, wH: boolean, id: string) {
      assert.deepEqual(result.colProportionalSpace, cPS, "colProportionalSpace:" + id);
      assert.deepEqual(result.rowProportionalSpace, rPS, "rowProportionalSpace:" + id);
      assert.deepEqual(result.guaranteedWidths, gW, "guaranteedWidths:" + id);
      assert.deepEqual(result.guaranteedHeights, gH, "guaranteedHeights:" + id);
      assert.deepEqual(result.wantsWidth, wW, "wantsWidth:" + id);
      assert.deepEqual(result.wantsHeight, wH, "wantsHeight:" + id);
    }

    it("iterateLayout works in the easy case where there is plenty of space and everything is satisfied on first go", () => {
      var c1 = new Mocks.FixedSizeComponent(50, 50);
      var c2 = new Plottable.Component();
      var c3 = new Plottable.Component();
      var c4 = new Mocks.FixedSizeComponent(20, 10);
      var table = new Plottable.Components.Table([
        [c1, c2],
        [c3, c4]
      ]);
      var result = (<any> table)._iterateLayout(500, 500);
      verifyLayoutResult(result, [215, 215], [220, 220], [50, 20], [50, 10], false, false, "");
    });

    it.skip("iterateLayout works in the difficult case where there is a shortage of space and layout requires iterations", () => {
      var c1 = new Mocks.FixedSizeComponent(490, 50);
      var c2 = new Plottable.Component();
      var c3 = new Plottable.Component();
      var c4 = new Plottable.Component();
      var table = new Plottable.Components.Table([
        [c1, c2],
        [c3, c4]
      ]);
      var result = (<any> table)._iterateLayout(500, 500);
      verifyLayoutResult(result, [0, 0], [220, 220], [480, 20], [50, 10], true, false, "");
    });

    it("iterateLayout works in the case where all components are fixed-size", () => {
      var c1 = new Mocks.FixedSizeComponent(50, 50);
      var c2 = new Mocks.FixedSizeComponent(50, 50);
      var c3 = new Mocks.FixedSizeComponent(50, 50);
      var c4 = new Mocks.FixedSizeComponent(50, 50);
      var table = new Plottable.Components.Table([
        [c1, c2],
        [c3, c4]
      ]);
      var result = (<any> table)._iterateLayout(100, 100);
      verifyLayoutResult(result, [0, 0], [0, 0], [50, 50], [50, 50], false, false, "when there's exactly enough space");

      result = (<any> table)._iterateLayout(80, 80);
      verifyLayoutResult(result, [0, 0], [0, 0], [50, 50], [50, 50], true, true, "still requests more space if constrained");
      result = (<any> table)._iterateLayout(80, 80, true);
      verifyLayoutResult(result, [0, 0], [0, 0], [40, 40], [40, 40], true, true, "accepts suboptimal layout if it's the final offer");

      result = (<any> table)._iterateLayout(120, 120);
      // If there is extra space in a fixed-size table, the extra space should not be allocated to proportional space
      verifyLayoutResult(result, [0, 0], [0, 0], [50, 50], [50, 50], false, false, "when there's extra space");
    });
  });

  describe("table._removeComponent works properly", () => {
    var c1 = new Plottable.Component();
    var c2 = new Plottable.Component();
    var c3 = new Plottable.Component();
    var c4 = new Plottable.Component();
    var c5 = new Plottable.Component();
    var c6 = new Plottable.Component();
    var table: Plottable.Components.Table;
    it("table._removeComponent works in basic case", () => {
      table = new Plottable.Components.Table([[c1, c2], [c3, c4], [c5, c6]]);
      table.removeComponent(c4);
      assert.deepEqual((<any> table)._rows, [[c1, c2], [c3, null], [c5, c6]], "remove one element");
    });

    it("table._removeComponent does nothing when component is not found", () =>  {
      table = new Plottable.Components.Table([[c1, c2], [c3, c4]]);
      table.removeComponent(c5);

      assert.deepEqual((<any> table)._rows, [[c1, c2], [c3, c4]], "remove nonexistent component");
    });

    it("table._removeComponent removing component twice should have same effect as removing it once", () =>  {
      table = new Plottable.Components.Table([[c1, c2, c3], [c4, c5, c6]]);

      table.removeComponent(c1);
      assert.deepEqual((<any> table)._rows, [[null, c2, c3], [c4, c5, c6]], "item twice");

      table.removeComponent(c1);
      assert.deepEqual((<any> table)._rows, [[null, c2, c3], [c4, c5, c6]], "item twice");
    });

    it("table._removeComponent doesn't do anything weird when called with null", () => {
      table = new Plottable.Components.Table([[c1, null], [c2, c3]]);

      table.removeComponent(null);
      assert.deepEqual((<any> table)._rows, [[c1, null], [c2, c3]]);
    });
  });
});
