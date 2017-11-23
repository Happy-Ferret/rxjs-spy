/**
 * @license Copyright © 2017 Nicholas Jamieson. All Rights Reserved.
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://github.com/cartant/rxjs-spy
 */
/*tslint:disable:no-unused-expression*/

import { expect } from "chai";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
import { Detector } from "./detector";
import { SnapshotPlugin } from "./plugin/snapshot-plugin";
import { create } from "./spy-factory";
import { Spy } from "./spy-interface";

import "rxjs/add/operator/mergeMap";

const options = {
    keptDuration: -1,
    keptValues: 4,
    warning: false
};

describe("detector", () => {

    let detector: Detector;
    let spy: Spy;

    afterEach(() => {

        if (spy) {
            spy.teardown();
        }
    });

    beforeEach(() => {

        spy = create({ ...options });
        detector = new Detector(spy.find(SnapshotPlugin));
    });

    it("should detect subscriptions and unsubscriptions", () => {

        const subject = new Subject<number>();
        const source = subject.tag("source");

        subject.next();

        const id = "";
        let detected = detector.detect(id);
        expect(detected).to.be.null;

        const subscription = source.subscribe();
        subject.next();

        detected = detector.detect(id)!;
        expect(detected.subscriptions).to.have.length(1);
        expect(detected.unsubscriptions).to.be.empty;

        subscription.unsubscribe();
        subject.next();

        detected = detector.detect(id)!;
        expect(detected.subscriptions).to.be.empty;
        expect(detected.unsubscriptions).to.have.length(1);
    });

    it("should detect merged subscriptions and unsubscriptions", () => {

        const subject = new Subject<number>();
        const source = subject.tag("source");
        const merged = source.mergeMap((value) => new BehaviorSubject<number>(value).tag("merge"));
        const subscription = merged.subscribe();

        subject.next();

        const id = "";
        let detected = detector.detect(id);
        expect(detected).to.be.null;

        subject.next();

        detected = detector.detect(id)!;
        expect(detected.mergeSubscriptions).to.have.length(1);
        expect(detected.mergeUnsubscriptions).to.be.empty;

        subject.next();

        detected = detector.detect(id)!;
        expect(detected).to.not.be.null;
        expect(detected.mergeSubscriptions).to.have.length(1);
        expect(detected.mergeUnsubscriptions).to.be.empty;

        subscription.unsubscribe();
    });
});
