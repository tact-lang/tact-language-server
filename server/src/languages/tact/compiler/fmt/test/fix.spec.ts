//  SPDX-License-Identifier: MIT
//  Copyright © 2025 TON Studio
import {test} from "./helpers"

describe("formatter automatic fixes", () => {
    it(
        "should format Foo { value: value } as Foo { value }",
        test(
            `
                fun foo() {
                    Foo { value: value };
                    Foo { value: value2 };
                    Foo { value: msg.value };
                    Foo { value: value() };
                    Foo { value: 10 };
                    Foo { value: value, other: other };
                    Foo { value: value, other: other2 };
                }
            `,
            `
                fun foo() {
                    Foo { value };
                    Foo { value: value2 };
                    Foo { value: msg.value };
                    Foo { value: value() };
                    Foo { value: 10 };
                    Foo { value, other };
                    Foo { value, other: other2 };
                }
            `,
        ),
    )
})
