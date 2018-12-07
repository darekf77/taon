import { Component, OnInit } from '@angular/core';
import { HelloController } from 'isomorphic-lib/browser/controllers/examples/HelloController';
import { TestController } from 'isomorphic-lib/browser/controllers/examples/TestController';
import { UsersController } from 'isomorphic-lib/browser/controllers/examples/UsersController';
import { ParentClass } from 'isomorphic-lib/browser/controllers/examples/ParentControllers';
import { ChildClass } from 'isomorphic-lib/browser/controllers/examples/Child1Controller';
import { ChildClass2 } from 'isomorphic-lib/browser/controllers/examples/Child2Controller';
import { ChildBaseCRUD } from 'isomorphic-lib/browser/controllers/examples/ChildBaseCRUD';
@Component({
  selector: 'app-app-test',
  templateUrl: './app-test.component.html',
  styleUrls: ['./app-test.component.css']
})
export class AppTestComponent implements OnInit {


  constructor(
    private hello: HelloController,
    testCtrl: TestController,
    userCtrl: UsersController,
    parent: ParentClass,
    child: ChildClass,
    child2: ChildClass2,
    childBaseCrud: ChildBaseCRUD
  ) {


    childBaseCrud.getAll().received.observable.subscribe(books => {
      console.log('child base crud get all', books.body.json);
    });

    testCtrl.getAll().received.observable.subscribe(books => {
      console.log('books', books);
    });

    userCtrl.getAll().received.observable.subscribe(user => {
      console.log('users', user);
    });
    hello.deleteUser(1111).received.observable.subscribe(d => console.log(d));
    hello.saveUSer(2222, { aa: 'aaa' }).received.observable.subscribe(d => console.log(d));
    hello.updateUSer(333, 'super cookies').received.observable.subscribe(d => console.log(d));

    hello.getUsersList(1).received.observable.subscribe(d => {
      console.log('USER LIST', d);
      console.log('users', d.body.json);
    });

    const sub = hello.getUser(888).received.observable.subscribe(d => {
      console.log(d);
      this.data.username = d.body.json.username;
      sub.unsubscribe();
    });


    parent.get().received.observable.subscribe(data => console.log('parent:', data.body.text));
    child.get().received.observable.subscribe(data => console.log('child:', data.body.text));
    child2.get().received.observable.subscribe(data => console.log('child2:', data.body.text));
    child2.loveme().received.observable.subscribe(data => console.log('child2 love :', data.body.text));
  }

  title = 'app';

  model = {
    user: this.hello.getUser(11).received.observable.map(d => {
      return d.body.json;
    })
  };

  data = {
    username: '-'
  };

  ngOnInit(): void {

  }
  submit() {
    const sub = this.hello.modifyUser(1, this.data).received.observable.subscribe(d => {
      console.log('modify ok', d);
      sub.unsubscribe();
    });
  }

}
